import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue/connection";
import { QUEUE_NAMES } from "@/lib/queue/queues";
import type { QueueJobPayloadMap } from "@/lib/queue/jobs";
import { notificationEventHandler } from "@/lib/services/notification-event-handler";
import { prisma } from "@/lib/db";
import { PaymentFactory, mapProviderStatus } from "@/lib/payments/payment-factory";
import { PaymentStatus } from "@/types/payments";
import { runReminderTick } from "@/lib/services/reminder-service";

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
      const { paymentId } = job.data;
      console.log("[queue][payment-retries] processing", job.id, job.data);

      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
        console.warn(`[queue][payment-retries] payment ${paymentId} not found, skipping`);
        return { ok: true, skipped: true };
      }

      // Already resolved (e.g. webhook arrived first) - nothing to do.
      if (payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.FAILED) {
        return { ok: true, status: payment.status };
      }

      if (!payment.providerRef) {
        throw new Error(`Payment ${paymentId} has no providerRef yet`);
      }

      const providerInstance = PaymentFactory.getProvider(payment.provider as any);
      const result = await providerInstance.getTransactionStatus(payment.providerRef);
      const providerStatus = String(result?.status || "").toUpperCase();
      const mappedStatus = mapProviderStatus(providerStatus);

      if (mappedStatus === PaymentStatus.COMPLETED) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.COMPLETED },
        });

        if (payment.contributionId) {
          await prisma.contribution.update({
            where: { id: payment.contributionId },
            data: { status: "PAID", paidAt: new Date() },
          });
        }

        return { ok: true, status: "COMPLETED" };
      }

      if (mappedStatus === PaymentStatus.FAILED) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            errorMessage: `Payment ${providerStatus.toLowerCase()} at provider`,
          },
        });
        return { ok: true, status: "FAILED" };
      }

      // Still pending/processing at the provider - throw so BullMQ retries with backoff.
      throw new Error(`Payment ${paymentId} still ${providerStatus || "pending"} at provider`);
    },
    { connection: redisConnection, concurrency: 5 }
  );
  bindWorkerEvents(worker, "payment-retries");

  // Once all retry attempts are exhausted and the provider never confirmed,
  // mark the payment FAILED so the user can retry via /api/payments/[id]/retry.
  worker.on("failed", async (job, err) => {
    if (!job) return;
    const attempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < attempts) return;

    const { paymentId } = job.data;
    try {
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (payment && payment.status !== PaymentStatus.COMPLETED && payment.status !== PaymentStatus.FAILED) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.FAILED,
            errorMessage: "Payment timed out - no confirmation received",
          },
        });
        console.warn(`[queue][payment-retries] marked payment ${paymentId} FAILED after exhausting retries`, err);
      }
    } catch (markError) {
      console.error("[queue][payment-retries] failed to mark payment FAILED after retries exhausted", markError);
    }
  });

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
      await runReminderTick();
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
