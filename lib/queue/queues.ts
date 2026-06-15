import { Queue, QueueEvents } from "bullmq";
import { redisConnection } from "@/lib/queue/connection";
import type { QueueJobPayloadMap } from "@/lib/queue/jobs";

export const QUEUE_NAMES = {
  notifications: "notifications",
  paymentRetries: "payment-retries",
  reports: "reports",
  scheduler: "scheduler",
} as const;

export const notificationsQueue = new Queue<QueueJobPayloadMap["notification.process"]>(
  QUEUE_NAMES.notifications,
  { connection: redisConnection }
);

export const paymentRetryQueue = new Queue<QueueJobPayloadMap["payment.retry"]>(
  QUEUE_NAMES.paymentRetries,
  { connection: redisConnection }
);

export const reportsQueue = new Queue<QueueJobPayloadMap["report.generate"]>(
  QUEUE_NAMES.reports,
  { connection: redisConnection }
);

export const schedulerQueue = new Queue<QueueJobPayloadMap["scheduler.tick"]>(
  QUEUE_NAMES.scheduler,
  { connection: redisConnection }
);

export const queueEvents = {
  notifications: new QueueEvents(QUEUE_NAMES.notifications, { connection: redisConnection }),
  paymentRetries: new QueueEvents(QUEUE_NAMES.paymentRetries, { connection: redisConnection }),
  reports: new QueueEvents(QUEUE_NAMES.reports, { connection: redisConnection }),
  scheduler: new QueueEvents(QUEUE_NAMES.scheduler, { connection: redisConnection }),
};
