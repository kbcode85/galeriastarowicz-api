import Stripe from 'stripe'
import {
	PaymentMethod,
	CreatePaymentParams,
	PaymentResponse,
	PaymentStatus,
	SupportedCurrency,
	BankTransferDetails,
	PaymentVerificationResponse,
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

			// Pobierz dane użytkownika z adresem rozliczeniowym
			const user = await strapi.entityService.findOne('plugin::users-permissions.user', params.userId, {
				populate: ['billingAddress'],
			})

			// Przygotuj adres rozliczeniowy jako JSON
			const billingAddressJson = user.billingAddress
				? {
						street: user.billingAddress.street,
						buildingNumber: user.billingAddress.buildingNumber,
						apartmentNumber: user.billingAddress.apartmentNumber,
						city: user.billingAddress.city,
						postalCode: user.billingAddress.postalCode,
						voivodeship: user.billingAddress.voivodeship,
						country: user.billingAddress.country,
						additionalInfo: user.billingAddress.additionalInfo,
					}
				: null

			// Przygotuj metadane
			const metadata = {
				userId: params.userId,
				userDocumentId: user.documentId,
				userEmail: user.email,
				subscriptionId: params.subscription,
				userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
				userPhone: user.phone || undefined,
				createdAt: new Date().toISOString(),
			}

			switch (method) {
				case 'stripe':
					return this.handleStripePayment(strapi, params, billingAddressJson, metadata)
				case 'bank_transfer':
					return this.handleBankTransfer(strapi, params, billingAddressJson, metadata)
				default:
					throw new Error('Nieobsługiwana metoda płatności')
			}
		} catch (error) {
			console.error('Error in createPayment:', error)
			throw error
		}
	},

	async handleStripePayment(
		strapi: any,
		params: CreatePaymentParams,
		billingAddress?: any,
		metadata?: any
	): Promise<PaymentResponse> {
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
					billingAddress,
					metadata,
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

	async handleBankTransfer(
		strapi: any,
		params: CreatePaymentParams,
		billingAddress?: any,
		metadata?: any
	): Promise<PaymentResponse> {
		try {
			const { amount, currency, userId, subscription } = params
			const paymentId = generateId('PAY')

			const bankTransferDetails = {
				accountNumber: process.env.BANK_ACCOUNT_NUMBER!,
				accountHolder: process.env.BANK_ACCOUNT_HOLDER!,
				bankName: process.env.BANK_NAME!,
				transferTitle: `${paymentId}`,
			}

			const paymentHistory = await strapi.db.query('api::payment-history.payment-history').create({
				data: {
					paymentId,
					method: 'bank_transfer',
					amount,
					currency,
					paymentStatus: 'pending',
					user: userId,
					subscription,
					billingAddress,
					metadata,
					bankTransferDetails,
				},
			})

			return {
				paymentId: paymentHistory.paymentId,
				status: 'pending',
				bankTransferDetails,
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

	async verifyPayment(strapi: any, paymentId: string, userId: string): Promise<PaymentVerificationResponse> {
		try {
			const payment = await strapi.db.query('api::payment-history.payment-history').findOne({
				where: {
					paymentId,
					user: userId,
				},
				populate: ['subscription'],
			})

			if (!payment) {
				throw new Error('Payment not found')
			}

			// Przygotuj wiadomość na podstawie statusów
			const getSubscriptionMessage = (paymentStatus: PaymentStatus, subscriptionStatus: string) => {
				if (paymentStatus === 'pending') {
					return 'Subskrypcja oczekuje na potwierdzenie płatności'
				}
				if (paymentStatus === 'completed' && subscriptionStatus === 'active') {
					return 'Subskrypcja jest aktywna'
				}
				if (paymentStatus === 'failed') {
					return 'Płatność nie powiodła się, subskrypcja nie została aktywowana'
				}
				if (paymentStatus === 'refunded') {
					return 'Płatność została zwrócona, subskrypcja anulowana'
				}
				return undefined
			}

			// Jeśli to płatność Stripe i mamy sessionId, sprawdź jej status w Stripe
			if (payment.method === 'stripe' && payment.stripeSessionId) {
				const session = await stripe.checkout.sessions.retrieve(payment.stripeSessionId)

				return {
					paymentId: payment.paymentId,
					status: payment.paymentStatus,
					paymentMethod: session.payment_method_types?.[0],
					subscription: {
						id: payment.subscription?.id,
						subscriptionId: payment.subscription?.subscriptionId,
						status: payment.subscription?.subscriptionStatus,
						message: getSubscriptionMessage(payment.paymentStatus, payment.subscription?.subscriptionStatus),
					},
					amount: payment.amount,
					currency: payment.currency,
					completedAt: payment.completedAt,
					failedAt: payment.failedAt,
					refundedAt: payment.refundedAt,
				}
			}

			// Dla innych metod płatności zwróć status z bazy
			return {
				paymentId: payment.paymentId,
				status: payment.paymentStatus,
				paymentMethod: payment.method,
				subscription: {
					id: payment.subscription?.id,
					subscriptionId: payment.subscription?.subscriptionId,
					status: payment.subscription?.subscriptionStatus,
					message: getSubscriptionMessage(payment.paymentStatus, payment.subscription?.subscriptionStatus),
				},
				amount: payment.amount,
				currency: payment.currency,
				completedAt: payment.completedAt,
				failedAt: payment.failedAt,
				refundedAt: payment.refundedAt,
			}
		} catch (error) {
			console.error('Error verifying payment:', error)
			throw error
		}
	},
}
