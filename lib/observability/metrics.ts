import client from "prom-client"

function getCounter<T extends string>(name: string, help: string, labelNames: T[]) {
  const existing = client.register.getSingleMetric(name) as client.Counter<T> | undefined
  if (existing) return existing

  return new client.Counter({
    name,
    help,
    labelNames,
  })
}

export const paymentWebhookEvents = getCounter(
  "mbole_pay_payment_webhook_events_total",
  "Payment webhook outcomes by provider and result",
  ["provider", "result"] as const,
)

export const paymentInitializationEvents = getCounter(
  "mbole_pay_payment_initialization_events_total",
  "Payment initialization outcomes by provider and result",
  ["provider", "result"] as const,
)

export const authSignInEvents = getCounter(
  "mbole_pay_auth_signin_events_total",
  "Authentication sign-in outcomes by provider, result, and role",
  ["provider", "result", "role"] as const,
)

export const apiErrorEvents = getCounter(
  "mbole_pay_api_error_events_total",
  "API errors by route and status",
  ["route", "status"] as const,
)

export function recordApiError(route: string, status: number) {
  apiErrorEvents.inc({ route, status: String(status) })
}
