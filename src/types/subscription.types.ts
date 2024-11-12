import { PaymentMethod, SupportedCurrency } from './payment.types'

export interface CreateCheckoutBody {
  planId: number
  currency: SupportedCurrency
  method: PaymentMethod
  duration: 'monthly' | 'yearly'
  successUrl?: string // wymagane dla Stripe
  cancelUrl?: string  // wymagane dla Stripe
}

export interface CheckoutResponse {
  paymentId: string
  status: 'pending'
  redirectUrl?: string // dla Stripe
  bankTransferDetails?: {
    accountNumber: string
    accountHolder: string
    bankName: string
    transferTitle: string
  }
  amount: number
  currency: SupportedCurrency
} 