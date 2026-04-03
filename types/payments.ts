/**
 * Payment types and enums for mobile money integration
 */

// Payment status enum
export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

// Payout status enum
export enum PayoutStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

// Payment provider enum
export enum PaymentProvider {
  MTN_MOMO = "MTN_MOMO",
  ORANGE_MONEY = "ORANGE_MONEY",
}

/**
 * Request to pay interface for payment initialization
 */
export interface RequestToPayRequest {
  amount: number;
  phoneNumber: string;
  externalId: string;
  description?: string;
  userId?: string;
  groupId?: string;
  contributionId?: string;
}

/**
 * Payment request response from provider
 */
export interface PaymentRequestResponse {
  referenceId: string;
  status: PaymentStatus;
  message?: string;
  timestamp: Date;
}

/**
 * Payment transaction details
 */
export interface PaymentTransaction {
  id: string;
  referenceId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  phoneNumber: string;
  status: PaymentStatus;
  providerRef?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment webhook payload (MTN)
 */
export interface MTNMomoWebhookPayload {
  externalId: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  payerMessage: string;
  payeeNote: string;
  transactionStatus: "PENDING" | "COMPLETED" | "FAILED";
  amount: string;
  currency: string;
  transactionId: string;
  transactionTime: string;
}

/**
 * Payment webhook payload (Orange Money)
 */
export interface OrangeMoneyWebhookPayload {
  transactionId: string;
  externalId: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  amount: number;
  currency: string;
  phoneNumber: string;
  timestamp: string;
  signature: string;
}

/**
 * Webhook payload union type
 */
export type WebhookPayload = MTNMomoWebhookPayload | OrangeMoneyWebhookPayload;

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

/**
 * Payment initialization response (API response)
 */
export interface InitializePaymentResponse {
  paymentId: string;
  referenceId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  phoneNumber: string;
  redirectUrl?: string;
  expiresAt: Date;
  message: string;
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  referenceId?: string;
  providerRef?: string;
  amount: number;
  currency: string;
  phoneNumber: string;
  errorMessage?: string;
  updatedAt: Date;
}

/**
 * Payment history item
 */
export interface PaymentHistoryItem {
  id: string;
  date: Date;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  phoneNumber: string;
  status: PaymentStatus;
  description?: string;
  groupName?: string;
}

/**
 * Payout details
 */
export interface PayoutDetails {
  id: string;
  groupId: string;
  groupName: string;
  recipientId: string;
  recipientName: string;
  recipientPhone: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  provider: PaymentProvider;
  scheduledDate: Date;
  processedDate?: Date;
  errorMessage?: string;
}

/**
 * Currency settings
 */
export interface CurrencySettings {
  code: string;
  name: string;
  symbol: string;
  minAmount: number;
  maxAmount: number;
  decimals: number;
}

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES: Record<string, CurrencySettings> = {
  XAF: {
    code: "XAF",
    name: "Central African CFA franc",
    symbol: "FCFA",
    minAmount: 100,
    maxAmount: 1000000,
    decimals: 0,
  },
  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    minAmount: 1,
    maxAmount: 10000,
    decimals: 2,
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    minAmount: 1,
    maxAmount: 10000,
    decimals: 2,
  },
};

/**
 * Payment error types
 */
export enum PaymentErrorType {
  INVALID_PHONE = "INVALID_PHONE",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  PROVIDER_ERROR = "PROVIDER_ERROR",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  DUPLICATE_TRANSACTION = "DUPLICATE_TRANSACTION",
  UNAUTHORIZED = "UNAUTHORIZED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Payment error interface
 */
export interface PaymentError {
  type: PaymentErrorType;
  message: string;
  provider?: PaymentProvider;
  statusCode?: number;
  details?: any;
}
