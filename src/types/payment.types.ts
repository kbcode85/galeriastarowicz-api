// Podstawowe typy
export type PaymentMethod = 'stripe' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'awaiting_confirmation'
export type PaymentType = 'subscription' | 'subscription_upgrade' | 'subscription_renewal' | 'order' | 'auction'

// Interfejsy dla danych przelewu
export interface BankTransferDetails {
	accountNumber: string
	accountHolder: string
	bankName: string
	title: string
	amount: number
	currency: string
}

// Interfejs dla przedmiotów zamówienia
export interface OrderItem {
	id: number
	name: string
	quantity: number
	unitAmount: number
}

// Interfejs dla metadanych płatności
export interface PaymentMetadata {
	planId?: string
	planLevel?: string
	duration?: string
	currency?: string
	locale?: string
	userId?: string
	features?: string
	[key: string]: any
}

// Interfejs dla metadanych Stripe
export interface StripeMetadata {
	type: string
	userId: string
	[key: string]: string
}

// Bazowe parametry płatności
export interface BasePaymentParams {
	amount: number
	currency: string
	userId: number
	type: PaymentType
	method: PaymentMethod
	metadata?: PaymentMetadata
	successUrl?: string
	cancelUrl?: string
	customerEmail?: string
}

// Parametry płatności subskrypcji
export interface SubscriptionPaymentParams extends BasePaymentParams {
	name: string
	description: string
}

// Parametry płatności zamówienia
export interface OrderPaymentParams extends BasePaymentParams {
	orderItems: OrderItem[]
}

export type CreatePaymentParams = SubscriptionPaymentParams | OrderPaymentParams

export interface PaymentResponse {
	paymentHistory: any
	redirectUrl?: string
	sessionId?: string
	bankTransferDetails?: BankTransferDetails
	availablePaymentMethods?: string[]
}

export interface CreateCheckoutBody {
	planId: number
	successUrl: string
	cancelUrl: string
	paymentType: PaymentMethod
	duration: 'monthly' | 'yearly'
}

export interface UpdatePaymentStatusParams {
	stripeSessionId?: string
	stripePaymentIntentId?: string
}

export interface RequestQuery {
	locale?: 'pl' | 'en'
	currency?: 'PLN' | 'EUR' | 'USD'
}

export interface PaymentHistoryData {
	userId: number
	amount: number
	currency: string
	type: PaymentType
	method: PaymentMethod
	status: PaymentStatus
	stripeSessionId?: string
	bankTransferDetails?: BankTransferDetails
	metadata?: PaymentMetadata
}
