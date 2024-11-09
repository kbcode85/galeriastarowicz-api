// Podstawowe typy
export type PlanLevel = 'basic' | 'premium' | 'premium_plus'
export type Locale = 'pl' | 'en'
export type Duration = 'monthly' | 'yearly'
export type PaymentMethod = 'stripe' | 'bank_transfer'
export type FeatureType = 'view_prices' | 'buy_products' | 'participate_auctions' | 'auto_bidding'

// Statusy
export type SubscriptionStatus = 'active' | 'expired' | 'pending_payment' | 'pending_upgrade'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'awaiting_confirmation'
export type PaymentType = 'subscription' | 'subscription_upgrade' | 'subscription_renewal' | 'order' | 'auction'

// Interfejsy dla cen i funkcji
export interface Price {
	amount: number
	isActive: boolean
}

export interface Feature {
	name: string
	description: string
	type: FeatureType
	isEnabled: boolean
}

// Interfejs dla danych przelewu bankowego
export interface BankTransferDetails {
	accountNumber: string
	title: string
	amount: number
	currency: string
}

// Interfejs dla szczegółów upgrade'u
export interface UpgradeDetails {
	newPlanId: number
	upgradeCost: number
	requestDate: Date
}

// Główne interfejsy
export interface SubscriptionPlan {
	id: number
	displayName: string
	names: Record<Locale, string>
	descriptions: Record<Locale, string>
	level: PlanLevel
	prices: {
		pl: {
			monthly: { PLN: Price }
			yearly: { PLN: Price }
		}
		en: {
			monthly: { EUR: Price; USD: Price }
			yearly: { EUR: Price; USD: Price }
		}
	}
	features: Record<Locale, Feature[]>
	isActive: boolean
	sortOrder: number
}

// Bazowe interfejsy dla modeli
export interface BaseSubscription {
	id: number
	subscriptionId: string
	user: number
	plan: number
	status: SubscriptionStatus
	startDate: Date
	endDate: Date
	paymentHistory?: number
	previousPlan?: number
	upgradeDetails?: UpgradeDetails
	renewalNotificationSent: boolean
}

export interface BasePaymentHistory {
	id: number
	paymentId: string
	user: number
	amount: number
	currency: string
	type: PaymentType
	method: PaymentMethod
	status: PaymentStatus
	subscription?: number
	previousSubscription?: number
	bankTransferDetails?: BankTransferDetails
	notificationsSent?: {
		paymentReminder?: boolean
		paymentConfirmation?: boolean
		paymentExpired?: boolean
	}
}

// Interfejsy z relacjami
export interface Subscription extends BaseSubscription {
	plan: number
	paymentHistory?: number
	previousPlan?: number
}

export interface PaymentHistory extends BasePaymentHistory {
	subscription?: number
	previousSubscription?: number
}

export interface SubscriptionWithRelations extends Omit<BaseSubscription, 'plan' | 'paymentHistory' | 'previousPlan'> {
	plan: SubscriptionPlan
	paymentHistory?: PaymentHistory
	previousPlan?: SubscriptionPlan
}

export interface PaymentHistoryWithRelations extends Omit<BasePaymentHistory, 'subscription' | 'previousSubscription'> {
	subscription?: SubscriptionWithRelations
	previousSubscription?: SubscriptionWithRelations
}

// Interfejsy dla parametrów serwisów
export interface CreateSubscriptionParams {
	userId: number
	planId: number
	paymentMethod: PaymentMethod
	duration: Duration
}

export interface CalculateUpgradeCostParams {
	currentSubscriptionId: string
	newPlanId: number
}

export interface UpgradePlanParams {
	subscriptionId: string
	newPlanId: number
	paymentMethod: PaymentMethod
}
