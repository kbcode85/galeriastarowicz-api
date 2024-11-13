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
				sessionId: payment.sessionId,
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

			// Najpierw sprawdź czy jest aktywna subskrypcja
			const activeSubscription = await strapi.db
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

			// Jeśli jest aktywna, zwróć ją
			if (activeSubscription) {
				const sevenDaysFromNow = new Date()
				sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
				const isExpiringSoon = new Date(activeSubscription.endDate) <= sevenDaysFromNow

				return {
					hasActiveSubscription: true,
					subscription: {
						id: activeSubscription.id,
						subscriptionId: activeSubscription.subscriptionId,
						planName: activeSubscription.plan.name,
						planLevel: activeSubscription.plan.level,
						startDate: activeSubscription.startDate,
						endDate: activeSubscription.endDate,
						subscriptionDuration: activeSubscription.subscriptionDuration,
						payment: activeSubscription.payment,
						status: activeSubscription.subscriptionStatus,
						isExpiringSoon,
						daysLeft: Math.ceil(
							(new Date(activeSubscription.endDate).getTime() - new Date().getTime()) / 
							(1000 * 60 * 60 * 24)
						)
					}
				}
			}

			// Sprawdź czy jest subskrypcja oczekująca na płatność
			const pendingSubscription = await strapi.db
				.query('api::subscription.subscription')
				.findOne({
					where: { 
						user: user.id,
						subscriptionStatus: 'pending_payment'
					},
					populate: {
						plan: {
							select: ['name', 'level']
						},
						payment: {
							select: ['paymentId', 'paymentStatus', 'amount', 'currency', 'method']
						}
					},
					orderBy: { createdAt: 'desc' }
				})

			// Jeśli jest oczekująca, zwróć ją
			if (pendingSubscription) {
				return {
					hasActiveSubscription: false,
					pendingSubscription: {
						id: pendingSubscription.id,
						subscriptionId: pendingSubscription.subscriptionId,
						planName: pendingSubscription.plan.name,
						planLevel: pendingSubscription.plan.level,
						status: pendingSubscription.subscriptionStatus,
						payment: pendingSubscription.payment,
						message: 'Subskrypcja oczekuje na potwierdzenie płatności'
					}
				}
			}

			// Jeśli nie ma ani aktywnej, ani oczekującej
			return {
				hasActiveSubscription: false,
				subscription: null
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
