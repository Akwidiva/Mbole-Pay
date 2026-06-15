import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue/connection";
import { QUEUE_NAMES } from "@/lib/queue/queues";
import type { QueueJobPayloadMap } from "@/lib/queue/jobs";
import { notificationEventHandler } from "@/lib/services/notification-event-handler";

let workersStarted = false;
let workers: Worker[] = [];

function bindWorkerEvents(worker: Worker, label: string) {
  worker.on("completed", (job) => {
    console.log(`[queue][${label}] completed`, job.id, job.name);
  });

  worker.on("failed", (job, err) => {
    console.error(`[queue][${label}] failed`, job?.id, err);
  });

  worker.on("error", (err) => {
    console.error(`[queue][${label}] worker error`, err);
  });
}

function createNotificationWorker() {
  const worker = new Worker<QueueJobPayloadMap["notification.process"]>(
    QUEUE_NAMES.notifications,
    async (job) => {
      await notificationEventHandler.handleEvent(job.data);
      return { ok: true };
    },
    { connection: redisConnection, concurrency: 10 }
  );
  bindWorkerEvents(worker, "notifications");
  return worker;
}

function createPaymentRetryWorker() {
  const worker = new Worker<QueueJobPayloadMap["payment.retry"]>(
    QUEUE_NAMES.paymentRetries,
    async (job) => {
      console.log("[queue][payment-retries] processing", job.id, job.data);
      // TODO: wire real retry logic to payment provider polling/retry service.
      return { ok: true };
    },
    { connection: redisConnection, concurrency: 5 }
  );
  bindWorkerEvents(worker, "payment-retries");
  return worker;
}

function createReportWorker() {
  const worker = new Worker<QueueJobPayloadMap["report.generate"]>(
    QUEUE_NAMES.reports,
    async (job) => {
      console.log("[queue][reports] generating report", job.id, job.data);
      // TODO: wire report generation + storage delivery.
      return { ok: true };
    },
    { connection: redisConnection, concurrency: 3 }
  );
  bindWorkerEvents(worker, "reports");
  return worker;
}

function createSchedulerWorker() {
  const worker = new Worker<QueueJobPayloadMap["scheduler.tick"]>(
    QUEUE_NAMES.scheduler,
    async (job) => {
      console.log("[queue][scheduler] tick", job.id, job.data);
      // TODO: enqueue contribution reminders, overdue payment retries, periodic reports.
      return { ok: true };
    },
    { connection: redisConnection, concurrency: 1 }
  );
  bindWorkerEvents(worker, "scheduler");
  return worker;
}

export function startQueueWorkers() {
  if (workersStarted) return workers;
  workersStarted = true;
  workers = [
    createNotificationWorker(),
    createPaymentRetryWorker(),
    createReportWorker(),
    createSchedulerWorker(),
  ];
  console.log("[queue] workers started");
  return workers;
}

export async function stopQueueWorkers() {
  for (const worker of workers) {
    await worker.close();
  }
  workers = [];
  workersStarted = false;
  console.log("[queue] workers stopped");
}
