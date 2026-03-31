// types/payment.ts
export type PaymentProvider = "mtn-momo" | "orange-money";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface PaymentInitRequest {
  phoneNumber: string;
  amount: number;
  currency: string; // "XAF" for CFA Francs
  contributionId: string;
  groupId: string;
  userId: string;
  referenceId?: string;
}

export interface PaymentInitResponse {
  transactionId: string;
  externalId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  phoneNumber: string;
  timestamp: Date;
  message: string;
}

export interface PaymentVerificationRequest {
  transactionId: string;
  externalId: string;
  provider: PaymentProvider;
}

export interface PaymentWebhookPayload {
  provider: PaymentProvider;
  transactionId: string;
  externalId: string;
  phoneNumber: string;
  amount: number;
  status: "SUCCESS" | "FAILED";
  timestamp: string;
  signature?: string;
  rawData: any;
}

export interface PaymentTransaction {
  id: string;
  contributionId: string;
  groupId: string;
  userId: string;
  phoneNumber: string;
  amount: number;
  provider: PaymentProvider;
  transactionId: string;
  externalId: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface MoMoConfig {
  serviceId: string;
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  callbackUrl: string;
}

export interface OrangeConfig {
  merchantId: string;
  merchantKey: string;
  merchantSecret: string;
  baseUrl: string;
  callbackUrl: string;
}
