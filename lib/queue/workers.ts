import { Worker } from "bullmq";
import { redisConnection } from "@/lib/queue/connection";
import { QUEUE_NAMES } from "@/lib/queue/queues";
import type { QueueJobPayloadMap } from "@/lib/queue/jobs";
import { notificationEventHandler } from "@/lib/services/notification-event-handler";
import { prisma } from "@/lib/db";
import { PaymentFactory, mapProviderStatus } from "@/lib/payments/payment-factory";
import { PaymentStatus } from "@/types/payments";
import { runReminderTick, notifyMemberDelinquent, notifyPayoutHeld } from "@/lib/services/reminder-service";

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

  // Once all retry attempts are exhausted, mark payment FAILED and check delinquency (FR-08).
  worker.on("failed", async (job, err) => {
    if (!job) return;
    const attempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < attempts) return;

    const { paymentId } = job.data;
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { contribution: true },
      });
      if (!payment) return;

      if (payment.status !== PaymentStatus.COMPLETED && payment.status !== PaymentStatus.FAILED) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: PaymentStatus.FAILED, errorMessage: "Payment timed out — no confirmation received" },
        });
        console.warn(`[queue][payment-retries] marked payment ${paymentId} FAILED after exhausting retries`);
      }

      // FR-08: after 3 total failures mark the member delinquent and notify admin
      const totalFailures = (payment.retryCount ?? 0) + 1;
      if (totalFailures >= 3 && payment.groupId && payment.userId) {
        const membership = await prisma.membership.findUnique({
          where: { userId_groupId: { userId: payment.userId, groupId: payment.groupId } },
          include: {
            user: { select: { id: true, email: true, name: true } },
            group: { select: { id: true, name: true } },
          },
        });

        if (membership && !membership.isDelinquent) {
          await prisma.membership.update({
            where: { id: membership.id },
            data: { isDelinquent: true, delinquentAt: new Date() },
          });

          notifyMemberDelinquent({
            userId: membership.user.id,
            userEmail: membership.user.email,
            userName: membership.user.name ?? undefined,
            groupId: membership.group.id,
            groupName: membership.group.name,
            failedAmount: payment.amount,
          }).catch(() => {});
        }
      }
    } catch (markError) {
      console.error("[queue][payment-retries] failed to handle exhausted retries", markError);
    }
  });

  return worker;
}

function createPayoutRetryWorker() {
  const worker = new Worker<QueueJobPayloadMap["payout.retry"]>(
    QUEUE_NAMES.payoutRetries,
    async (job) => {
      const { payoutId, groupId, cycle } = job.data;
      console.log("[queue][payout-retries] processing", job.id, job.data);

      const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
      if (!payout) return { ok: true, skipped: true };
      if (payout.status === "COMPLETED") return { ok: true, status: "COMPLETED" };
      if (payout.status === "HELD") return { ok: true, status: "HELD" };

      const fapshi = PaymentFactory.getProvider("FAPSHI" as any);
      const group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } });

      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: "PROCESSING", retryCount: (payout.retryCount ?? 0) + 1, lastRetry: new Date() },
      });

      await fapshi.transfer({
        amount: payout.amount,
        phoneNumber: payout.phoneNumber,
        externalId: `payout-${groupId}-cycle-${cycle}-retry-${job.attemptsMade}`,
        description: `Njangi payout — ${group?.name ?? groupId} cycle ${cycle}`,
      });

      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: "COMPLETED", processedDate: new Date() },
      });

      return { ok: true, status: "COMPLETED" };
    },
    { connection: redisConnection, concurrency: 2 }
  );
  bindWorkerEvents(worker, "payout-retries");

  // After all 3 retry attempts fail, mark payout HELD (escrow) and alert admin + recipient (FR-08).
  worker.on("failed", async (job, err) => {
    if (!job) return;
    const attempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < attempts) return;

    const { payoutId, groupId } = job.data;
    try {
      const payout = await prisma.payout.findUnique({
        where: { id: payoutId },
        include: {
          recipient: { select: { id: true, email: true, name: true } },
          group: { select: { id: true, name: true } },
        },
      });
      if (!payout || payout.status === "COMPLETED" || payout.status === "HELD") return;

      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "HELD",
          errorMessage: err?.message ?? "All retry attempts failed",
          escrowReason: "Automatic payout failed after 3 retries — manual release required",
        },
      });

      notifyPayoutHeld({
        recipientId: payout.recipient.id,
        recipientEmail: payout.recipient.email,
        recipientName: payout.recipient.name ?? undefined,
        groupId: payout.group.id,
        groupName: payout.group.name,
        amount: payout.amount,
        payoutId,
      }).catch(() => {});

      console.error(`[queue][payout-retries] payout ${payoutId} moved to HELD after exhausting retries`);
    } catch (holdError) {
      console.error("[queue][payout-retries] failed to mark payout HELD", holdError);
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
    createPayoutRetryWorker(),
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
