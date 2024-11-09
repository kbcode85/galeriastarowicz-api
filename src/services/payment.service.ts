import Stripe from 'stripe'
import {
	PaymentMethod,
	PaymentType,
	PaymentStatus,
	CreatePaymentParams,
	OrderPaymentParams,
	SubscriptionPaymentParams,
	StripeMetadata,
	PaymentResponse,
	UpdatePaymentStatusParams,
	PaymentHistoryData,
} from '../types/payment.types'
import { generateId } from '../utils/generateId'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-10-28.acacia',
})

const PAYMENT_METHODS_BY_CURRENCY = {
	PLN: ['card', 'blik', 'p24'] as const,
	EUR: ['card'] as const,
	USD: ['card'] as const,
}

export const paymentService = {
	async createPayment(strapi: any, params: CreatePaymentParams) {
		if ('orderItems' in params) {
			return this.handleOrderPayment(strapi, params)
		} else {
			return params.method === 'stripe'
				? this.handleStripePayment(strapi, params)
				: this.handleBankTransferPayment(strapi, params)
		}
	},

	async handleStripePayment(strapi: any, params: SubscriptionPaymentParams) {
		const {
			amount,
			currency,
			name,
			description,
			userId,
			type,
			method,
			successUrl,
			cancelUrl,
			customerEmail,
			metadata = {},
		} = params

		try {
			const user = await strapi.db.query('plugin::users-permissions.user').findOne({
				where: { id: userId },
			})

			if (!user) {
				throw new Error(`User not found`)
			}

			const currencyKey = currency.toUpperCase() as keyof typeof PAYMENT_METHODS_BY_CURRENCY
			const availablePaymentMethods = PAYMENT_METHODS_BY_CURRENCY[currencyKey] || ['card']

			const stripeMetadata: StripeMetadata = {
				type,
				userId: userId.toString(),
				...Object.entries(metadata).reduce(
					(acc, [key, value]) => ({
						...acc,
						[key]: value?.toString(),
					}),
					{}
				),
			}

			const baseConfig: Stripe.Checkout.SessionCreateParams = {
				mode: 'payment',
				payment_method_types: [...availablePaymentMethods],
				billing_address_collection: 'auto',
				line_items: [
					{
						price_data: {
							currency: currency.toLowerCase(),
							product_data: {
								name,
								description,
							},
							unit_amount: amount,
						},
						quantity: 1,
					},
				],
				success_url: successUrl,
				cancel_url: cancelUrl,
				customer_email: customerEmail || user.email,
				metadata: stripeMetadata,
				locale: metadata.locale as Stripe.Checkout.SessionCreateParams.Locale,
				allow_promotion_codes: false,
			}

			const session = await stripe.checkout.sessions.create(baseConfig)

			const paymentHistory = await this.createPaymentHistory(strapi, {
				userId,
				amount: amount / 100,
				currency,
				type,
				method,
				status: 'pending',
				stripeSessionId: session.id,
				metadata: {
					...metadata,
					availablePaymentMethods,
				},
			})

			return {
				paymentHistory,
				redirectUrl: session.url,
				sessionId: session.id,
				availablePaymentMethods: [...availablePaymentMethods],
			}
		} catch (error) {
			throw error
		}
	},

	async handleBankTransferPayment(strapi: any, params: SubscriptionPaymentParams) {
		const { amount, currency, userId, type, metadata = {} } = params

		try {
			const bankTransferDetails = {
				accountNumber: process.env.BANK_ACCOUNT_NUMBER,
				accountHolder: process.env.BANK_ACCOUNT_HOLDER,
				bankName: process.env.BANK_NAME,
				title: `Payment ${generateId(type.toUpperCase())}`,
				amount: amount / 100,
				currency,
			}

			const paymentHistory = await this.createPaymentHistory(strapi, {
				userId,
				amount: amount / 100,
				currency,
				type,
				method: 'bank_transfer',
				status: 'awaiting_confirmation',
				bankTransferDetails,
				metadata,
			})

			return {
				paymentHistory,
				bankTransferDetails,
			}
		} catch (error) {
			throw error
		}
	},

	async createPaymentHistory(strapi: any, data: PaymentHistoryData) {
		const paymentHistory = await strapi.db.query('api::payment-history.payment-history').create({
			data: {
				paymentId: generateId(data.type.toUpperCase()),
				...data,
			},
		})

		await strapi.db.query('api::payment-history.payment-history').update({
			where: { id: paymentHistory.id },
			data: {
				user: data.userId,
			},
		})

		return await strapi.db.query('api::payment-history.payment-history').findOne({
			where: { id: paymentHistory.id },
			populate: ['user'],
		})
	},

	async handleOrderPayment(strapi: any, params: OrderPaymentParams) {
		throw new Error('Order payment not implemented yet')
	},

	async confirmBankTransfer(strapi: any, paymentId: string) {
		try {
			return await strapi.db.query('api::payment-history.payment-history').update({
				where: { paymentId },
				data: {
					status: 'completed',
					completedAt: new Date(),
				},
			})
		} catch (error) {
			throw error
		}
	},

	async cancelPayment(strapi: any, paymentId: string) {
		try {
			const payment = await strapi.db.query('api::payment-history.payment-history').findOne({
				where: { paymentId },
			})

			if (!payment) {
				throw new Error('Payment not found')
			}

			if (payment.method === 'stripe' && payment.stripeSessionId) {
				await stripe.checkout.sessions.expire(payment.stripeSessionId)
			}

			return await strapi.db.query('api::payment-history.payment-history').update({
				where: { id: payment.id },
				data: {
					status: 'cancelled',
					cancelledAt: new Date(),
				},
			})
		} catch (error) {
			throw error
		}
	},

	async updatePaymentStatus(strapi: any, sessionId: string, status: PaymentStatus, params: UpdatePaymentStatusParams) {
		try {
			const payment = await strapi.db.query('api::payment-history.payment-history').findOne({
				where: { stripeSessionId: sessionId },
			})

			if (!payment) {
				throw new Error('Payment not found')
			}

			return await strapi.db.query('api::payment-history.payment-history').update({
				where: { id: payment.id },
				data: {
					status,
					...(status === 'completed' && { completedAt: new Date() }),
					...(status === 'failed' && { failedAt: new Date() }),
					...(status === 'refunded' && { refundedAt: new Date() }),
					...params,
				},
			})
		} catch (error) {
			throw error
		}
	},
}
