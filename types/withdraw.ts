export interface WithdrawalPreview {
  phoneNumber: string
  amount: number
  ussd: string
  encodedUssd: string
  dialerUrl: string
}

export interface WithdrawalRequestRecord {
  id: string
  phoneNumber: string
  amount: number
  ussd: string
  dialerUrl: string
  provider: "MTN_MOMO"
  status: "PENDING"
  createdAt: string
  updatedAt: string
}

export interface WithdrawalRequestResponse {
  success: boolean
  data?: {
    withdrawalRequest: WithdrawalRequestRecord
    preview: WithdrawalPreview
  }
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export interface WithdrawalValidationErrors {
  phoneNumber?: string
  amount?: string
  general?: string
}
