import type { NotificationEvent } from "@/lib/services/notification-event-handler";

export type QueueJobName =
  | "notification.process"
  | "payment.retry"
  | "report.generate"
  | "scheduler.tick";

export interface PaymentRetryJobPayload {
  paymentId: string;
  reason?: string;
  requestedAt?: string;
}

export interface ReportGenerateJobPayload {
  reportType: "GROUP_SUMMARY" | "PAYMENT_SUMMARY" | "DISPUTE_SUMMARY";
  groupId?: string;
  requestedByUserId?: string;
  requestedAt?: string;
}

export interface SchedulerTickJobPayload {
  trigger: "hourly" | "daily" | "manual";
  requestedAt?: string;
}

export interface QueueJobPayloadMap {
  "notification.process": NotificationEvent;
  "payment.retry": PaymentRetryJobPayload;
  "report.generate": ReportGenerateJobPayload;
  "scheduler.tick": SchedulerTickJobPayload;
}
