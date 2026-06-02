import * as z from "zod"
import type { WithdrawalPreview, WithdrawalValidationErrors } from "@/types/withdraw"

export const WITHDRAWAL_USSD_PREFIX = "*126*1"

export const withdrawFormSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(1, "MTN mobile number is required")
    .refine((value) => isValidCameroonMtnNumber(value), {
      message: "Enter a valid MTN MoMo number, like +237691234567",
    }),
  amount: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .int("Use a whole number amount")
    .positive("Amount must be greater than 0"),
})

export type WithdrawFormValues = z.infer<typeof withdrawFormSchema>

export function normalizeCameroonMtnNumber(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, "")

  if (digitsOnly.length === 9 && /^[679]/.test(digitsOnly)) {
    return digitsOnly
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith("237")) {
    const localNumber = digitsOnly.slice(3)
    if (/^[679]\d{8}$/.test(localNumber)) {
      return localNumber
    }
  }

  return ""
}

export function isValidCameroonMtnNumber(phoneNumber: string): boolean {
  return normalizeCameroonMtnNumber(phoneNumber).length === 9
}

export function normalizeWithdrawalAmount(amount: number | string): number {
  const numericAmount = typeof amount === "string" ? Number(amount) : amount
  if (!Number.isFinite(numericAmount)) {
    return 0
  }
  return Math.trunc(numericAmount)
}

export function buildMtnWithdrawalUssd(phoneNumber: string, amount: number): string {
  const normalizedPhone = normalizeCameroonMtnNumber(phoneNumber)
  const normalizedAmount = normalizeWithdrawalAmount(amount)

  if (!normalizedPhone || normalizedAmount <= 0) {
    throw new Error("Cannot build MTN withdrawal USSD without a valid phone number and amount")
  }

  return `${WITHDRAWAL_USSD_PREFIX}*${normalizedPhone}*${normalizedAmount}#`
}

export function encodeUssdForDialer(ussd: string): string {
  return `tel:${encodeURIComponent(ussd)}`
}

export function createWithdrawalPreview(
  phoneNumber: string,
  amount: number | string
): WithdrawalPreview {
  const normalizedPhone = normalizeCameroonMtnNumber(phoneNumber)
  const normalizedAmount = normalizeWithdrawalAmount(amount)
  const ussd = buildMtnWithdrawalUssd(normalizedPhone, normalizedAmount)

  return {
    phoneNumber: normalizedPhone,
    amount: normalizedAmount,
    ussd,
    encodedUssd: encodeURIComponent(ussd),
    dialerUrl: encodeUssdForDialer(ussd),
  }
}

export function validateWithdrawalFields(values: {
  phoneNumber?: string
  amount?: number | string
}): { valid: boolean; errors: WithdrawalValidationErrors; preview?: WithdrawalPreview } {
  const errors: WithdrawalValidationErrors = {}
  const phoneNumber = values.phoneNumber?.trim() || ""
  const amount = values.amount ?? ""

  if (!phoneNumber) {
    errors.phoneNumber = "MTN mobile number is required"
  } else if (!isValidCameroonMtnNumber(phoneNumber)) {
    errors.phoneNumber = "Enter a valid MTN MoMo number, like +237691234567"
  }

  const normalizedAmount = normalizeWithdrawalAmount(amount)
  if (amount === "" || amount === null || amount === undefined) {
    errors.amount = "Amount is required"
  } else if (!Number.isFinite(Number(amount)) || normalizedAmount <= 0) {
    errors.amount = "Amount must be greater than 0"
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    errors: {},
    preview: createWithdrawalPreview(phoneNumber, normalizedAmount),
  }
}
