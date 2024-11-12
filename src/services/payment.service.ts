import Stripe from 'stripe'
import {
	PaymentMethod,
	CreatePaymentParams,
	PaymentResponse,
	PaymentStatus,
	SupportedCurrency,
	BankTransferDetails,
} from '../types/payment.types'
import { generateId } from '../utils/generateId'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-10-28.acacia',
})

const getPaymentMethodsForCurrency = (
	currency: SupportedCurrency
): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] => {
	switch (currency) {
		case 'PLN':
			return ['card', 'blik', 'p24']
		case 'EUR':
		case 'USD':
			return ['card']
		default:
			return ['card']
	}
}

export const paymentService = {
	async createPayment(strapi: any, params: CreatePaymentParams): Promise<PaymentResponse> {
		try {
			const { method } = params

			switch (method) {
				case 'stripe':
					return this.handleStripePayment(strapi, params)
				case 'bank_transfer':
					return this.handleBankTransfer(strapi, params)
				default:
					throw new Error('Nieobsługiwana metoda płatności')
			}
		} catch (error) {
			console.error('Error in createPayment:', error)
			throw error
		}
	},

	async handleStripePayment(strapi: any, params: CreatePaymentParams): Promise<PaymentResponse> {
		try {
			const { amount, currency, userId, successUrl, cancelUrl, subscription } = params

			if (!successUrl || !cancelUrl) {
				throw new Error('Brak wymaganych URL dla płatności Stripe')
			}

			const paymentId = generateId('PAY')

			const sessionParams: Stripe.Checkout.SessionCreateParams = {
				payment_method_types: getPaymentMethodsForCurrency(currency),
				line_items: [
					{
						price_data: {
							currency: currency.toLowerCase(),
							product_data: {
								name: 'Subskrypcja',
							},
							unit_amount: Math.round(amount * 100),
						},
						quantity: 1,
					},
				],
				mode: 'payment',
				success_url: successUrl,
				cancel_url: cancelUrl,
			}

			const session = await stripe.checkout.sessions.create(sessionParams)

			const paymentHistory = await strapi.db.query('api::payment-history.payment-history').create({
				data: {
					paymentId,
					method: 'stripe',
					stripeSessionId: session.id,
					amount,
					currency,
					paymentStatus: 'pending',
					user: userId,
					subscription,
				},
			})

			return {
				paymentId: paymentHistory.paymentId,
				status: 'pending',
				redirectUrl: session.url!,
			}
		} catch (error) {
			console.error('Error in handleStripePayment:', error)
			throw error
		}
	},

	async handleBankTransfer(strapi: any, params: CreatePaymentParams): Promise<PaymentResponse> {
		try {
			const { amount, currency, userId, subscription } = params
			const paymentId = generateId('PAY')

			const bankDetails = {
				accountNumber: process.env.BANK_ACCOUNT_NUMBER!,
				accountHolder: process.env.BANK_ACCOUNT_HOLDER!,
				bankName: process.env.BANK_NAME!,
				transferTitle: `${paymentId}_${userId}`,
			}

			const data = {
				paymentId,
				method: 'bank_transfer' as const,
				amount,
				currency,
				paymentStatus: 'pending' as const,
				user: userId,
				subscription,
				bankDetails,
			}

			console.log('Attempting to create payment with data:', JSON.stringify(data, null, 2))

			const paymentHistory = await strapi.db.query('api::payment-history.payment-history').create({
				data,
			})

			console.log('Created payment history:', JSON.stringify(paymentHistory, null, 2))

			return {
				paymentId: paymentHistory.paymentId,
				status: 'pending',
				bankTransferDetails: bankDetails,
			}
		} catch (error) {
			console.error('Error in handleBankTransfer:', error)
			throw error
		}
	},

	async getPaymentDetails(strapi: any, paymentId: string) {
		return await strapi.db.query('api::payment-history.payment-history').findOne({
			where: { paymentId },
			populate: ['user', 'subscription', 'bankTransferDetails'],
		})
	},

	async updatePaymentStatus(strapi: any, paymentId: string, status: PaymentStatus) {
		const payment = await this.getPaymentDetails(strapi, paymentId)

		if (!payment) {
			throw new Error('Płatność nie została znaleziona')
		}

		const updateData: any = {
			paymentStatus: status,
		}

		switch (status) {
			case 'completed':
				updateData.completedAt = new Date()
				break
			case 'failed':
				updateData.failedAt = new Date()
				break
			case 'refunded':
				updateData.refundedAt = new Date()
				break
		}

		await strapi.db.query('api::payment-history.payment-history').update({
			where: { id: payment.id },
			data: updateData,
		})

		if (payment.subscription) {
			const subscriptionStatus = status === 'completed' ? 'active' : 'cancelled'
			await strapi.db.query('api::subscription.subscription').update({
				where: { id: payment.subscription.id },
				data: { subscriptionStatus },
			})
		}

		return await this.getPaymentDetails(strapi, paymentId)
	},
}
