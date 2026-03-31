// lib/payment-utils.ts
import crypto from "crypto";
import { v4 as uuid } from "uuid";
import type { PaymentProvider } from "@/types/payment";

/**
 * Generate a unique transaction reference ID
 */
export function generateTransactionId(): string {
  return `TRX-${Date.now()}-${uuid().split("-")[0].toUpperCase()}`;
}

/**
 * Generate HMAC signature for webhook verification
 * @param data The data to sign
 * @param secret The secret key
 * @returns Base64 encoded signature
 */
export function generateSignature(data: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64");
}

/**
 * Verify webhook signature
 * @param payload The webhook payload
 * @param signature The provided signature
 * @param secret The secret key
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Format phone number for payment provider
 * Ensures it's in international format
 * @param phoneNumber Raw phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, "");

  // If it starts with +, it's already in international format
  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // If it starts with 237 (Cameroon), add +
  if (cleaned.startsWith("237")) {
    return "+" + cleaned;
  }

  // If it starts with 6 or 7 (Cameroon local), add +237
  if (cleaned.startsWith("6") || cleaned.startsWith("7")) {
    return "+237" + cleaned;
  }

  // Default: assume it needs Cameroon code
  return "+237" + cleaned;
}

/**
 * Validate phone number for Cameroon
 * @param phoneNumber Phone number to validate
 * @returns true if valid Cameroon number
 */
export function isValidCameroonPhone(phoneNumber: string): boolean {
  const formatted = formatPhoneNumber(phoneNumber);
  // Cameroon phone format: +237 + 9 digits, first digit 6 or 7
  const regex = /^\+237[67]\d{8}$/;
  return regex.test(formatted);
}

/**
 * Validate amount
 * @param amount Amount to validate
 * @returns true if amount is valid (between 100 and 5,000,000 XAF)
 */
export function isValidAmount(amount: number): boolean {
  const minAmount = 100; // 100 XAF
  const maxAmount = 5000000; // 5 million XAF
  return amount >= minAmount && amount <= maxAmount && Number.isInteger(amount);
}

/**
 * Parse webhook signature from various formats
 * @param headerValue The raw header value
 * @returns Parsed signature
 */
export function parseSignatureHeader(headerValue: string): string {
  // Handle "Bearer <signature>" format
  if (headerValue.includes("Bearer")) {
    return headerValue.replace("Bearer ", "").trim();
  }
  // Handle "Signature <signature>" format
  if (headerValue.includes("Signature")) {
    return headerValue.replace("Signature ", "").trim();
  }
  // Return as-is if no prefix
  return headerValue.trim();
}

/**
 * Log payment event for audit trail
 * @param provider Payment provider
 * @param event Event type
 * @param data Event data
 */
export function logPaymentEvent(
  provider: PaymentProvider,
  event: string,
  data: any
): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${provider.toUpperCase()}] ${event}`, data);

  // TODO: Store in database for audit trail
  // prisma.paymentLog.create({
  //   data: {
  //     provider,
  //     event,
  //     data: JSON.stringify(data),
  //     timestamp: new Date(),
  //   },
  // });
}

/**
 * Retry logic for API calls
 * @param fn Function to retry
 * @param maxRetries Maximum number of retries
 * @param delayMs Delay between retries in milliseconds
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Test if a phone number is a test number
 * @param phoneNumber Phone number to check
 * @returns true if it's a test number
 */
export function isTestPhoneNumber(phoneNumber: string): boolean {
  const testNumbers = [
    "+237699999999",
    "+237655555555",
    "+237700000000",
    "+237688888888",
  ];
  const formatted = formatPhoneNumber(phoneNumber);
  return testNumbers.includes(formatted);
}
