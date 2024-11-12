import { factories } from '@strapi/strapi'
import { Context } from 'koa'
import { paymentService } from '../../../services/payment.service'
import { CreateCheckoutBody } from '../../../types/subscription.types'
import { generateId } from '../../../utils/generateId'

interface Price {
	currency: string
	duration: 'monthly' | 'yearly'
	amount: number
	isActive: boolean
}

interface SubscriptionPlan {
	id: number
	name: string
	description: string
	isActive: boolean
	level: 'basic'
	prices: Price[]
}

export default factories.createCoreController('api::subscription.subscription', ({ strapi }) => ({
	async createCheckout(ctx: Context) {
		try {
			const { planId, currency, method, duration, successUrl, cancelUrl } = ctx.request.body as CreateCheckoutBody
			const user = ctx.state.user

			// Walidacja podstawowych pól
			if (!planId || !currency || !method || !duration) {
				return ctx.badRequest('Brak wymaganych pól')
			}

			// Walidacja URL dla Stripe
			if (method === 'stripe' && (!successUrl || !cancelUrl)) {
				return ctx.badRequest('Dla płatności Stripe wymagane są successUrl i cancelUrl')
			}

			// Pobierz plan subskrypcji
			const plan = await strapi.db
				.query('api::subscription-plan.subscription-plan')
				.findOne({
					where: { id: planId, isActive: true },
					populate: { prices: true }
				}) as unknown as SubscriptionPlan

			if (!plan || !plan.isActive) {
				return ctx.badRequest('Plan subskrypcji nie został znaleziony lub jest nieaktywny')
			}

			// Znajdź cenę dla wybranej waluty i okresu
			const price = plan.prices.find(
				p => p.currency === currency && 
				p.duration === duration && 
				p.isActive
			)

			if (!price) {
				return ctx.badRequest(`Brak aktywnej ceny dla ${currency} i okresu ${duration}`)
			}

			// Utwórz subskrypcję w statusie pending
			const subscription = await strapi.db
				.query('api::subscription.subscription')
				.create({
					data: {
						subscriptionId: generateId('SUB'),
						user: user.id,
						plan: planId,
						subscriptionStatus: 'pending_payment',
						subscriptionDuration: duration,
						startDate: new Date(),
						endDate: duration === 'yearly' 
								? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
								: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
					},
				})

			// Utwórz płatność
			const payment = await paymentService.createPayment(strapi, {
					amount: price.amount,
					currency,
					userId: user.id.toString(),
					method,
					successUrl,
					cancelUrl,
					subscription: subscription.id,
			})

			return {
				paymentId: payment.paymentId,
				status: payment.status,
				redirectUrl: payment.redirectUrl,
						bankTransferDetails: payment.bankTransferDetails,
						amount: price.amount,
						currency,
			}

		} catch (error) {
			ctx.throw(500, error.message)
		}
	},

	async getStatus(ctx: Context) {
		try {
			const user = ctx.state.user

			const subscription = await strapi.db
				.query('api::subscription.subscription')
				.findOne({
					where: { 
						user: user.id,
						subscriptionStatus: 'active',
						endDate: {
							$gt: new Date()
						}
					},
					populate: {
						plan: {
							select: ['name', 'level']
						},
						payment: {
							select: ['paymentId', 'paymentStatus', 'amount', 'currency']
						}
					},
					orderBy: { endDate: 'desc' }
				})

			if (!subscription) {
				return {
					hasActiveSubscription: false,
					subscription: null
				}
			}

			// Sprawdź czy subskrypcja wygasa w ciągu 7 dni
			const sevenDaysFromNow = new Date()
			sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
			const isExpiringSoon = new Date(subscription.endDate) <= sevenDaysFromNow

			return {
				hasActiveSubscription: true,
				subscription: {
					id: subscription.id,
					subscriptionId: subscription.subscriptionId,
					planName: subscription.plan.name,
					planLevel: subscription.plan.level,
					startDate: subscription.startDate,
					endDate: subscription.endDate,
					subscriptionDuration: subscription.subscriptionDuration,
					payment: subscription.payment,
					isExpiringSoon,
					daysLeft: Math.ceil(
						(new Date(subscription.endDate).getTime() - new Date().getTime()) / 
						(1000 * 60 * 60 * 24)
					)
				}
			}

		} catch (error) {
			ctx.throw(500, error.message)
		}
	},

	async checkExpired(ctx) {
		try {
			const expiredCount = await strapi
				.service('api::subscription.subscription')
				.checkExpiredSubscriptions()

			return {
				expiredCount,
				message: `Checked and updated ${expiredCount} expired subscriptions`
			}
		} catch (error) {
			ctx.throw(500, error.message)
		}
	}
}))
