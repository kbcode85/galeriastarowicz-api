import {
	CreateSubscriptionParams,
	CalculateUpgradeCostParams,
	UpgradePlanParams,
	SubscriptionWithRelations,
	PaymentHistoryWithRelations,
	SubscriptionPlan,
	PaymentHistory,
	Subscription,
	Duration,
} from '../types/subscription.types'
import { generateId } from '../utils/generateId'

interface ServiceResponse<T> {
	data: T
	error?: string
}

export const subscriptionService = {
	// Tworzenie nowej subskrypcji
	async createSubscription(
		strapi: any,
		params: CreateSubscriptionParams
	): Promise<
		ServiceResponse<{
			subscription: SubscriptionWithRelations
			paymentHistory: PaymentHistoryWithRelations
		}>
	> {
		try {
			const { userId, planId, paymentMethod, duration } = params

			const plan = (await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
				where: { id: planId, isActive: true },
			})) as SubscriptionPlan

			if (!plan) {
				return { data: null, error: 'Plan not found or inactive' }
			}

			const startDate = new Date()
			const endDate = new Date()
			if (duration === 'yearly') {
				endDate.setFullYear(endDate.getFullYear() + 1)
			} else {
				endDate.setMonth(endDate.getMonth() + 1)
			}

			// Tworzenie subskrypcji
			const subscription = (await strapi.db.query('api::subscription.subscription').create({
				data: {
					subscriptionId: generateId('SUB'),
					user: userId,
					plan: planId,
					status: 'pending_payment',
					startDate,
					endDate,
					renewalNotificationSent: false,
				},
			})) as Subscription

			// Pobierz cenę dla wybranej waluty i okresu
			const price = plan.prices.pl[duration].PLN

			// Tworzenie historii płatności
			const paymentHistory = (await strapi.db.query('api::payment-history.payment-history').create({
				data: {
					paymentId: generateId('PAY'),
					user: userId,
					amount: price.amount,
					currency: 'PLN',
					type: 'subscription',
					method: paymentMethod,
					status: paymentMethod === 'bank_transfer' ? 'awaiting_confirmation' : 'pending',
					subscription: subscription.id,
					bankTransferDetails:
						paymentMethod === 'bank_transfer'
							? {
									accountNumber: process.env.BANK_ACCOUNT_NUMBER,
									title: `Subscription ${subscription.subscriptionId}`,
									amount: price.amount,
									currency: 'PLN',
								}
							: null,
					notificationsSent: {
						paymentReminder: false,
						paymentConfirmation: false,
						paymentExpired: false,
					},
				},
			})) as PaymentHistory

			// Pobierz pełne dane z relacjami
			const fullSubscription = (await strapi.db.query('api::subscription.subscription').findOne({
				where: { id: subscription.id },
				populate: ['plan', 'paymentHistory'],
			})) as SubscriptionWithRelations

			const fullPaymentHistory = (await strapi.db.query('api::payment-history.payment-history').findOne({
				where: { id: paymentHistory.id },
				populate: ['subscription', 'subscription.plan'],
			})) as PaymentHistoryWithRelations

			return {
				data: {
					subscription: fullSubscription,
					paymentHistory: fullPaymentHistory,
				},
			}
		} catch (error) {
			console.error('Error creating subscription:', error)
			return { data: null, error: error.message }
		}
	},

	// Obliczanie kosztu upgrade'u planu
	async calculateUpgradeCost(
		strapi: any,
		params: CalculateUpgradeCostParams
	): Promise<
		ServiceResponse<{
			upgradeCost: number
			remainingDays: number
			currentPlanRate: number
			newPlanRate: number
		}>
	> {
		try {
			const { currentSubscriptionId, newPlanId } = params

			const currentSubscription = (await strapi.db.query('api::subscription.subscription').findOne({
				where: { subscriptionId: currentSubscriptionId },
				populate: ['plan'],
			})) as SubscriptionWithRelations

			const newPlan = (await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
				where: { id: newPlanId },
			})) as SubscriptionPlan

			if (!currentSubscription || !newPlan) {
				return { data: null, error: 'Subscription or new plan not found' }
			}

			const remainingDays = Math.ceil(
				(new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
			)

			const currentPlanRate = currentSubscription.plan.prices.pl.monthly.PLN.amount / 30
			const newPlanRate = newPlan.prices.pl.monthly.PLN.amount / 30
			const upgradeCost = Math.ceil((newPlanRate - currentPlanRate) * remainingDays)

			return {
				data: {
					upgradeCost,
					remainingDays,
					currentPlanRate,
					newPlanRate,
				},
			}
		} catch (error) {
			console.error('Error calculating upgrade cost:', error)
			return { data: null, error: error.message }
		}
	},

	// Upgrade planu
	async upgradePlan(
		strapi: any,
		params: UpgradePlanParams
	): Promise<
		ServiceResponse<{
			subscription: SubscriptionWithRelations
			paymentHistory: PaymentHistoryWithRelations
		}>
	> {
		try {
			const { subscriptionId, newPlanId, paymentMethod } = params

			const costCalculation = await this.calculateUpgradeCost(strapi, {
				currentSubscriptionId: subscriptionId,
				newPlanId,
			})

			if (!costCalculation.data) {
				return { data: null, error: costCalculation.error }
			}

			const subscription = (await strapi.db.query('api::subscription.subscription').findOne({
				where: { subscriptionId },
			})) as Subscription

			// Aktualizacja subskrypcji
			const updatedSubscription = (await strapi.db.query('api::subscription.subscription').update({
				where: { id: subscription.id },
				data: {
					status: 'pending_upgrade',
					previousPlan: subscription.plan,
					upgradeDetails: {
						newPlanId,
						upgradeCost: costCalculation.data.upgradeCost,
						requestDate: new Date(),
					},
				},
			})) as Subscription

			// Tworzenie historii płatności dla upgrade'u
			const paymentHistory = (await strapi.db.query('api::payment-history.payment-history').create({
				data: {
					paymentId: generateId('PAY'),
					user: subscription.user,
					amount: costCalculation.data.upgradeCost,
					currency: 'PLN',
					type: 'subscription_upgrade',
					method: paymentMethod,
					status: paymentMethod === 'bank_transfer' ? 'awaiting_confirmation' : 'pending',
					subscription: subscription.id,
					previousSubscription: subscription.id,
					bankTransferDetails:
						paymentMethod === 'bank_transfer'
							? {
									accountNumber: process.env.BANK_ACCOUNT_NUMBER,
									title: `Upgrade ${subscription.subscriptionId}`,
									amount: costCalculation.data.upgradeCost,
									currency: 'PLN',
								}
							: null,
					notificationsSent: {
						paymentReminder: false,
						paymentConfirmation: false,
						paymentExpired: false,
					},
				},
			})) as PaymentHistory

			// Pobierz pełne dane z relacjami
			const fullSubscription = (await strapi.db.query('api::subscription.subscription').findOne({
				where: { id: updatedSubscription.id },
				populate: ['plan', 'paymentHistory', 'previousPlan'],
			})) as SubscriptionWithRelations

			const fullPaymentHistory = (await strapi.db.query('api::payment-history.payment-history').findOne({
				where: { id: paymentHistory.id },
				populate: ['subscription', 'subscription.plan', 'previousSubscription', 'previousSubscription.plan'],
			})) as PaymentHistoryWithRelations

			return {
				data: {
					subscription: fullSubscription,
					paymentHistory: fullPaymentHistory,
				},
			}
		} catch (error) {
			console.error('Error upgrading plan:', error)
			return { data: null, error: error.message }
		}
	},
}
