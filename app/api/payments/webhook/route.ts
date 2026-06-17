import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PaymentFactory } from "@/lib/payments/payment-factory";
import { PaymentStatus, PaymentProvider, ApiResponse } from "@/types/payments";
import crypto from "crypto";
import { createLogger } from "@/lib/observability/logger";
import { paymentWebhookEvents, recordApiError } from "@/lib/observability/metrics";
import { notifyPaymentReceived } from "@/lib/services/reminder-service";
import { recordCycleOnChain } from "@/lib/blockchain/factory";

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
    const updatedPayment = await prisma.payment.update({
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

      // In-app notification
      const paymentWithDetails = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: { user: { select: { id: true, email: true, name: true } }, group: { select: { id: true, name: true } } },
      })
      if (paymentWithDetails) {
        notifyPaymentReceived({
          userId: paymentWithDetails.user.id,
          userEmail: paymentWithDetails.user.email,
          userName: paymentWithDetails.user.name ?? undefined,
          amount: paymentWithDetails.amount,
          groupId: paymentWithDetails.group.id,
          groupName: paymentWithDetails.group.name,
        }).catch(() => {})
      }

      // Auto-payout: check if ALL contributions for this cycle are now PAID
      triggerPayoutIfComplete(payment.groupId, contribution.cycle).catch((err) =>
        logger.error("Auto-payout check failed", { groupId: payment.groupId, error: String(err) })
      )
    }

    // If payment failed, increment retry count and log error
    if (updatedStatus === PaymentStatus.FAILED) {
      const newRetryCount = payment.retryCount + 1;
      paymentWebhookEvents.inc({ provider, result: "failed" })
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          retryCount: newRetryCount,
          lastRetry: new Date(),
        },
      });

      if (newRetryCount >= 3) {
        logger.error("Payment failed after 3 retries", { paymentId: payment.id, provider, retryCount: newRetryCount })
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

// ── Auto-payout logic ────────────────────────────────────────────────────────

async function triggerPayoutIfComplete(groupId: string, cycle: number) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })
  if (!group) return

  // Only process if this cycle matches the group's current active cycle
  if (group.currentCycle !== cycle) return

  // Check if a payout was already triggered
  const existingPayout = await prisma.payout.findFirst({ where: { groupId, cycle } })
  if (existingPayout && existingPayout.status !== "SCHEDULED") return

  // Check all contributions for this cycle
  const contributions = await prisma.contribution.findMany({ where: { groupId, cycle } })
  if (contributions.length === 0) return
  const allPaid = contributions.every((c) => c.status === "PAID")
  if (!allPaid) return

  const memberCount = group.memberships.length
  const totalPool = group.contributionAmount * memberCount

  // Determine recipient
  let recipientMembership
  if (group.payoutOrder === "LOTTERY" && existingPayout) {
    // Recipient was selected at cycle start
    recipientMembership = group.memberships.find((m) => m.userId === existingPayout.recipientId)
  } else {
    // SEQUENTIAL: current index in join order
    const idx = group.currentRecipientIndex % memberCount
    recipientMembership = group.memberships[idx]
  }

  if (!recipientMembership) return

  const recipientPhone = recipientMembership.user.phone
  if (!recipientPhone) {
    console.error("Auto-payout: recipient has no phone number", { userId: recipientMembership.userId })
    return
  }

  // Create/update the payout record
  const payoutData = {
    groupId,
    recipientId: recipientMembership.userId,
    amount: totalPool,
    currency: "XAF",
    status: "PROCESSING",
    provider: "FAPSHI",
    phoneNumber: recipientPhone,
    scheduledDate: new Date(),
    cycle,
  }

  let payout
  if (existingPayout) {
    payout = await prisma.payout.update({
      where: { id: existingPayout.id },
      data: { status: "PROCESSING", processedDate: new Date() },
    })
  } else {
    payout = await prisma.payout.create({ data: payoutData })
  }

  // Trigger Fapshi transfer to recipient
  try {
    const fapshi = PaymentFactory.getProvider("FAPSHI" as any)
    await fapshi.transfer({
      amount: totalPool,
      phoneNumber: recipientPhone,
      externalId: `payout-${groupId}-cycle-${cycle}`,
      description: `Njangi payout — ${group.name} cycle ${cycle}`,
    })

    // Mark payout completed
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: "COMPLETED", processedDate: new Date() },
    })

    // Advance to next cycle
    const nextRecipientIndex = (group.currentRecipientIndex + 1) % memberCount
    await prisma.group.update({
      where: { id: groupId },
      data: {
        currentCycle: group.currentCycle + 1,
        currentRecipientIndex: nextRecipientIndex,
      },
    })

    console.log(`[payout] Cycle ${cycle} complete for group ${groupId} — paid ${totalPool} XAF to ${recipientPhone}`)

    // Record cycle completion on-chain (non-blocking)
    recordCycleOnChain({
      dbGroupId: groupId,
      cycle,
      dbRecipientId: recipientMembership.userId,
      amount: totalPool,
      memberCount,
    }).catch((err) => console.warn("[blockchain] recordCycleComplete failed (non-fatal):", err.message))

  } catch (err: any) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: "FAILED", errorMessage: err.message },
    })
    console.error("[payout] Fapshi transfer failed:", err.message)
  }
}

// ─────────────────────────────────────────────────────────────────────────────

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
