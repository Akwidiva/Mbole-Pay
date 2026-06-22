import { JobsOptions } from "bullmq";
import { notificationsQueue, paymentRetryQueue, payoutRetryQueue, reportsQueue, schedulerQueue } from "@/lib/queue/queues";
import type {
  PaymentRetryJobPayload,
  PayoutRetryJobPayload,
  QueueJobPayloadMap,
  ReportGenerateJobPayload,
  SchedulerTickJobPayload,
} from "@/lib/queue/jobs";
import type { NotificationEvent } from "@/lib/services/notification-event-handler";

const defaultJobOptions: JobsOptions = {
  removeOnComplete: 100,
  removeOnFail: 500,
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 3000,
  },
};

export async function enqueueNotification(event: NotificationEvent) {
  return notificationsQueue.add("notification.process", event, {
    ...defaultJobOptions,
    attempts: 5,
  });
}

export async function enqueuePaymentRetry(payload: PaymentRetryJobPayload) {
  return paymentRetryQueue.add("payment.retry", payload, {
    ...defaultJobOptions,
    attempts: 8,
    backoff: { type: "exponential", delay: 5000 },
  });
}

// Schedules an auto-debit retry 24 hours after a payment failure (FR-08).
// Used by the webhook when a payment is marked FAILED and retryCount < 3.
export async function enqueueDelayedPaymentAutoRetry(payload: PaymentRetryJobPayload) {
  const delay24h = 24 * 60 * 60 * 1000;
  return paymentRetryQueue.add("payment.retry", payload, {
    ...defaultJobOptions,
    delay: delay24h,
    attempts: 1, // single attempt — the webhook will re-enqueue if it fails again
    jobId: `auto-retry-${payload.paymentId}-${Date.now()}`,
  });
}

// Enqueues a payout retry with staggered backoff: 1h → 4h → 24h (FR-07/FR-08).
export async function enqueuePayoutRetry(payload: PayoutRetryJobPayload) {
  return payoutRetryQueue.add("payout.retry", payload, {
    ...defaultJobOptions,
    attempts: 3,
    backoff: { type: "exponential", delay: 60 * 60 * 1000 }, // 1h, 4h, ~24h
    jobId: `payout-retry-${payload.payoutId}`,
  });
}

export async function enqueueReportGeneration(payload: ReportGenerateJobPayload) {
  return reportsQueue.add("report.generate", payload, {
    ...defaultJobOptions,
    attempts: 2,
  });
}

export async function enqueueSchedulerTick(payload: SchedulerTickJobPayload) {
  return schedulerQueue.add("scheduler.tick", payload, {
    ...defaultJobOptions,
    repeat: undefined,
  });
}

export type { QueueJobPayloadMap };
export type { PayoutRetryJobPayload };
