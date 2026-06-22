import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PaymentStatus, PaymentProvider, ApiResponse } from "@/types/payments";
import { createLogger } from "@/lib/observability/logger";
import { paymentWebhookEvents, recordApiError } from "@/lib/observability/metrics";
import { triggerPayoutIfComplete } from "@/lib/services/payout-service"
import { notifyPayoutCompleted, notifyContributorsPayoutComplete } from "@/lib/services/reminder-service"
import { recordContributionOnChain, recordCycleOnChain } from "@/lib/blockchain/factory"
import { enqueueDelayedPaymentAutoRetry, enqueuePayoutRetry } from "@/lib/queue/enqueue";

const logger = createLogger("payments.webhook")

/**
 * POST /api/payments/webhook
 * Webhook endpoint for receiving payment callbacks from MTN Momo and Orange Money
 *
 * Both providers will POST updates to this endpoint with transaction status changes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.info("Webhook received", { source: body?.source || body?.gateway || "unknown" })

    // Determine which provider sent the webhook
    let provider: PaymentProvider;
    let externalId: string;
    let transactionStatus: string;
    let transactionId: string;

    // Fapshi sends x-wh-secret header — use it as primary detection
    const whSecret = request.headers.get("x-wh-secret");
    const fSecret = process.env.FAPSHI_WEBHOOK_SECRET || "";

    if (whSecret !== null || body.transId || body.externalId) {
      // Fapshi webhook
      provider = PaymentProvider.FAPSHI;

      // Verify plain-text secret matches what we configured
      if (fSecret && whSecret !== fSecret) {
        paymentWebhookEvents.inc({ provider, result: "invalid_signature" })
        logger.warn("Webhook rejected: invalid Fapshi secret", { received: whSecret })
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: { code: "INVALID_SIGNATURE", message: "Fapshi webhook secret mismatch" },
            timestamp: new Date(),
          },
          { status: 401 }
        );
      }

      // Fapshi payload fields: transId, status, externalId, amount
      externalId = body.externalId;
      transactionStatus = body.status;
      transactionId = body.transId;
    } else {
      paymentWebhookEvents.inc({ provider: "unknown", result: "unknown_provider" })
      logger.warn("Webhook rejected: unknown provider", { body })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "UNKNOWN_PROVIDER",
            message: "Cannot determine payment provider from webhook payload",
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // ── Payout webhook ────────────────────────────────────────────────────────
    // Fapshi sends payout callbacks with externalId = "payout-{groupId}-cycle-{n}"
    const payoutMatch = externalId?.match(/^payout-(.+)-cycle-(\d+)$/)
    if (payoutMatch) {
      const groupId = payoutMatch[1]
      const cycle = parseInt(payoutMatch[2], 10)

      const payout = await prisma.payout.findFirst({ where: { groupId, cycle } })
      if (!payout) {
        logger.warn("Payout webhook: no payout record found", { groupId, cycle })
        return NextResponse.json<ApiResponse>({ success: false, error: { code: "PAYOUT_NOT_FOUND", message: "Payout not found" }, timestamp: new Date() }, { status: 404 })
      }

      const isSuccess = transactionStatus === "SUCCESSFUL" || transactionStatus === "COMPLETED"
      const isFailed  = transactionStatus === "FAILED" || transactionStatus === "EXPIRED"

      if (isSuccess && payout.status !== "COMPLETED") {
        await prisma.payout.update({ where: { id: payout.id }, data: { status: "COMPLETED", processedDate: new Date() } })
        logger.info("Payout confirmed via webhook", { groupId, cycle, amount: payout.amount })
        paymentWebhookEvents.inc({ provider, result: "payout_completed" })

        // Advance the group cycle
        const group = await prisma.group.findUnique({
          where: { id: groupId },
          include: { memberships: { include: { user: { select: { id: true, name: true, email: true, phone: true } } }, orderBy: { createdAt: "asc" } } },
        })
        if (group) {
          const memberCount = group.memberships.length
          await prisma.group.update({
            where: { id: groupId },
            data: { currentCycle: group.currentCycle + 1, currentRecipientIndex: (group.currentRecipientIndex + 1) % memberCount },
          })

          const recipient = group.memberships.find((m) => m.userId === payout.recipientId)

          notifyPayoutCompleted({ userId: payout.recipientId, userEmail: recipient?.user.email ?? "", amount: payout.amount, groupId, groupName: group.name }).catch(() => {})
          notifyContributorsPayoutComplete({ groupId, groupName: group.name, cycle, totalPool: payout.amount, recipientName: recipient?.user.name ?? undefined }).catch(() => {})

          const contributions = await prisma.contribution.findMany({ where: { groupId, cycle, status: "PAID" } })
          for (const c of contributions) {
            recordContributionOnChain({ dbGroupId: groupId, cycle, dbMemberId: c.userId, amount: c.amount, isRecipientOffset: false }).catch(() => {})
          }
          recordCycleOnChain({ dbGroupId: groupId, cycle, dbRecipientId: payout.recipientId, amount: payout.amount, memberCount }).catch(() => {})
        }
      } else if (isFailed && payout.status !== "COMPLETED") {
        await prisma.payout.update({ where: { id: payout.id }, data: { status: "FAILED", errorMessage: "Payout failed at provider" } })
        logger.error("Payout failed via webhook", { groupId, cycle })
        paymentWebhookEvents.inc({ provider, result: "payout_failed" })
        enqueuePayoutRetry({ payoutId: payout.id, groupId, cycle, requestedAt: new Date().toISOString() }).catch(() => {})
      } else {
        logger.info("Payout webhook received — no action needed", { groupId, cycle, status: transactionStatus, payoutStatus: payout.status })
      }

      return NextResponse.json<ApiResponse>({ success: true, data: { payoutId: payout.id, status: transactionStatus }, timestamp: new Date() }, { status: 200 })
    }

    // ── Collection payment webhook ─────────────────────────────────────────────
    // Find the payment record using externalId (which is the paymentId)
    const payment = await prisma.payment.findUnique({
      where: { id: externalId },
      include: {
        contribution: true,
        user: true,
        group: true,
      },
    });

    if (!payment) {
      paymentWebhookEvents.inc({ provider, result: "payment_not_found" })
      logger.warn("Payment not found for webhook externalId", { externalId, provider })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "PAYMENT_NOT_FOUND",
            message: "Payment not found",
          },
          timestamp: new Date(),
        },
        { status: 404 }
      );
    }

    // Verify provider matches
    if (payment.provider !== provider) {
      paymentWebhookEvents.inc({ provider, result: "provider_mismatch" })
      logger.warn("Webhook provider mismatch", { paymentId: payment.id, expected: payment.provider, provider })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "PROVIDER_MISMATCH",
            message: "Payment provider does not match webhook source",
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Map provider status to our PaymentStatus
    let updatedStatus: PaymentStatus;
    let errorMessage: string | null = null;

    switch (transactionStatus) {
      case "SUCCESSFUL":
      case "COMPLETED":
        updatedStatus = PaymentStatus.COMPLETED;
        break;
      case "FAILED":
      case "EXPIRED":
        updatedStatus = PaymentStatus.FAILED;
        errorMessage = "Payment failed at provider";
        break;
      case "PENDING":
      case "PROCESSING":
        updatedStatus = PaymentStatus.PROCESSING;
        break;
      default:
        updatedStatus = PaymentStatus.PROCESSING;
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: updatedStatus,
        providerRef: transactionId,
        errorMessage: errorMessage,
        updatedAt: new Date(),
      },
    });

    // If payment completed, update contribution status then check for auto-payout
    if (updatedStatus === PaymentStatus.COMPLETED && payment.contributionId) {
      const contribution = await prisma.contribution.update({
        where: { id: payment.contributionId },
        data: { status: "PAID", paidAt: new Date() },
      })

      paymentWebhookEvents.inc({ provider, result: "completed" })
      logger.info("Contribution marked as PAID", { contributionId: payment.contributionId, userId: payment.userId })

      // Trigger payout check — notifications + blockchain happen after payout completes
      triggerPayoutIfComplete(payment.groupId, contribution.cycle).catch((err) =>
        logger.error("Auto-payout check failed", { groupId: payment.groupId, error: String(err) })
      )
    }

    // FR-08: payment failed — increment retry count, schedule 24h auto-retry if < 3 attempts
    if (updatedStatus === PaymentStatus.FAILED) {
      const newRetryCount = (payment.retryCount ?? 0) + 1;
      paymentWebhookEvents.inc({ provider, result: "failed" })
      await prisma.payment.update({
        where: { id: payment.id },
        data: { retryCount: newRetryCount, lastRetry: new Date() },
      });

      if (newRetryCount < 3) {
        // Auto-debit retry after 24h — payment worker will re-initiate with Fapshi
        enqueueDelayedPaymentAutoRetry({
          paymentId: payment.id,
          reason: `auto_retry_${newRetryCount}_of_3`,
          requestedAt: new Date().toISOString(),
        }).catch((err) => logger.error("Failed to enqueue 24h auto-retry", { paymentId: payment.id, error: String(err) }))
        logger.info("Scheduled 24h auto-retry for failed payment", { paymentId: payment.id, retryCount: newRetryCount })
      } else {
        logger.error("Payment failed after 3 retries — member will be marked delinquent", { paymentId: payment.id, provider, retryCount: newRetryCount })
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          paymentId: payment.id,
          status: updatedStatus,
          provider: provider,
          message: `Payment status updated to ${updatedStatus}`,
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    paymentWebhookEvents.inc({ provider: "unknown", result: "error" })
    recordApiError("/api/payments/webhook", 500)
    logger.error("Webhook processing error", { error: String(error) })

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "WEBHOOK_PROCESSING_ERROR",
          message: "Failed to process webhook",
          details: process.env.NODE_ENV === "development" ? error.toString() : undefined,
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}


/**
 * GET /api/payments/webhook
 * Health check endpoint for webhook delivery verification
 */
export async function GET(request: NextRequest) {
  return NextResponse.json<ApiResponse>(
    {
      success: true,
      data: {
        message: "Payment webhook endpoint is operational",
        timestamp: new Date(),
      },
      timestamp: new Date(),
    },
    { status: 200 }
  );
}
