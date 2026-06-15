import { JobsOptions } from "bullmq";
import { notificationsQueue, paymentRetryQueue, reportsQueue, schedulerQueue } from "@/lib/queue/queues";
import type {
  PaymentRetryJobPayload,
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
