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
  sessionId?: string
  redirectUrl?: string
  bankTransferDetails?: {
    accountNumber: string
    accountHolder: string
    bankName: string
    transferTitle: string
  }
}

export interface PaymentVerificationResponse {
  paymentId: string
  status: PaymentStatus
  paymentMethod: string
  subscription: {
    id: number
    subscriptionId: string
    status: string
    message?: string
  }
  amount: number
  currency: string
  completedAt?: Date
  failedAt?: Date
  refundedAt?: Date
}

export interface PaymentDetails {
  paymentId: string
  method: 'stripe' | 'bank_transfer'
  amount: number
  currency: string
  status: PaymentStatus
  billingAddress: any
  subscription: {
    id: number
    subscriptionId: string
    status: string
  } | null
  metadata: any
  dates: {
    createdAt: Date
    completedAt?: Date
    failedAt?: Date
    refundedAt?: Date
  }
  bankDetails?: {
    accountNumber: string
    accountHolder: string
    bankName: string
    transferTitle: string
  }
  stripeDetails?: {
    sessionId: string
    paymentId: string
  }
} 