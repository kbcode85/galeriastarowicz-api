export type PaymentMethod = 'stripe' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type SupportedCurrency = 'PLN' | 'EUR' | 'USD'

export interface BankTransferDetails {
  accountNumber: string
  accountHolder: string
  bankName: string
  transferTitle: string
}

export interface CreatePaymentParams {
  amount: number
  currency: SupportedCurrency
  userId: string
  method: PaymentMethod
  successUrl?: string
  cancelUrl?: string
  subscription?: number
}

export interface PaymentResponse {
  paymentId: string
  status: PaymentStatus
  redirectUrl?: string
  bankTransferDetails?: BankTransferDetails
} 