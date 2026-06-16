import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db";
import { PaymentFactory } from "@/lib/payments/payment-factory";
import { PaymentStatus, PaymentProvider, ApiResponse, InitializePaymentResponse } from "@/types/payments";
import { userHasPermission } from "@/lib/rbac";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createLogger } from "@/lib/observability/logger";
import { paymentInitializationEvents, recordApiError } from "@/lib/observability/metrics";
import { enqueuePaymentRetry } from "@/lib/queue/enqueue";
import { bootstrapQueueWorkers } from "@/lib/queue/bootstrap";

const logger = createLogger("payments.initialize")

// Ensure the payment-retry worker (and other queue workers) are running so
// the post-initialize safety-check job enqueued below actually gets processed.
bootstrapQueueWorkers();

/**
 * POST /api/payments/initialize
 * Initialize a payment request for a user contribution
 *
 * Request body:
 * {
 *   groupId: string;
 *   contributionId: string;
 *   phoneNumber: string;
 *   provider?: "MTN_MOMO";
 *   amount?: number; // If not provided, uses contribution amount
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    logger.info("Payment initialization request received")

    if (!session?.user?.email) {
      paymentInitializationEvents.inc({ provider: "unknown", result: "unauthorized" })
      logger.warn("Payment initialization rejected: unauthorized")
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
          timestamp: new Date(),
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { groupId, contributionId, phoneNumber, provider, amount } = body;

    // Validation
    if (!groupId || !contributionId || !phoneNumber) {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "validation_error" })
      logger.warn("Payment initialization rejected: missing required fields", { groupId, contributionId, phoneNumber })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields: groupId, contributionId, phoneNumber",
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    const resolvedProvider = provider || (await PaymentFactory.getDefaultProvider());

    // Validate phone number format
    const phoneRegex = /^(\+237|\+221)?[679]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "invalid_phone" })
      logger.warn("Payment initialization rejected: invalid phone", { phoneNumber })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_PHONE",
            message: "Phone number format invalid. Use +237XXXXXXXXX or local format",
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "user_not_found" })
      logger.warn("Payment initialization rejected: user not found", { email: session.user.email })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
          timestamp: new Date(),
        },
        { status: 404 }
      );
    }

    if ((user as any).kycStatus !== "APPROVED") {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "kyc_required" })
      logger.warn("Payment initialization rejected: KYC not approved", { userId: user.id, kycStatus: (user as any).kycStatus })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "KYC_REQUIRED",
            message: "Identity verification required. Complete KYC to make payments.",
          },
          timestamp: new Date(),
        },
        { status: 403 }
      );
    }

    // Check permission to make payments (requires payments:create)
    const hasPermission = await userHasPermission(user.id, groupId, "payments:create");
    if (!hasPermission) {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "forbidden" })
      logger.warn("Payment initialization rejected: forbidden", { userId: user.id, groupId })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to make payments in this group",
          },
          timestamp: new Date(),
        },
        { status: 403 }
      );
    }

    // Get contribution to verify it exists and user is part of group
    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
      include: {
        group: true,
        user: true,
      },
    });

    if (!contribution) {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "contribution_not_found" })
      logger.warn("Payment initialization rejected: contribution not found", { contributionId })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "CONTRIBUTION_NOT_FOUND",
            message: "Contribution not found",
          },
          timestamp: new Date(),
        },
        { status: 404 }
      );
    }

    if (contribution.groupId !== groupId) {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "group_mismatch" })
      logger.warn("Payment initialization rejected: group mismatch", { contributionId, groupId })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "GROUP_MISMATCH",
            message: "Contribution does not belong to specified group",
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    if (contribution.userId !== user.id) {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "unauthorized" })
      logger.warn("Payment initialization rejected: unauthorized contribution", { contributionId, userId: user.id })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You are not authorized to pay this contribution",
          },
          timestamp: new Date(),
        },
        { status: 403 }
      );
    }

    // Check if contribution is already paid
    if (contribution.status === "PAID") {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "already_paid" })
      logger.warn("Payment initialization rejected: already paid", { contributionId })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "ALREADY_PAID",
            message: "This contribution has already been paid",
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Use provided amount or contribution amount
    const paymentAmount = amount || contribution.amount;

    if (paymentAmount <= 0) {
      paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "invalid_amount" })
      logger.warn("Payment initialization rejected: invalid amount", { paymentAmount })
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_AMOUNT",
            message: "Payment amount must be greater than 0",
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Check for duplicate pending payments. Only payments created within the
    // configured timeout window are treated as blocking; older stuck rows are
    // marked FAILED so a new attempt can proceed instead of being blocked forever.
    const timeoutMinutes = Number(process.env.PAYMENT_TIMEOUT_MINUTES) || 15;
    const timeoutThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const existingPayment = await prisma.payment.findFirst({
      where: {
        contributionId: contributionId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (existingPayment) {
      if (existingPayment.createdAt > timeoutThreshold) {
        paymentInitializationEvents.inc({ provider: String(provider || "unknown"), result: "duplicate" })
        logger.warn("Payment initialization rejected: duplicate pending payment", { contributionId, existingPaymentId: existingPayment.id })
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: "DUPLICATE_PAYMENT",
              message: "A payment is already pending for this contribution",
              details: {
                paymentId: existingPayment.id,
                status: existingPayment.status,
              },
            },
            timestamp: new Date(),
          },
          { status: 409 }
        );
      }

      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: PaymentStatus.FAILED,
          errorMessage: "Payment timed out",
        },
      });
      logger.warn("Stale pending payment marked as FAILED", { contributionId, paymentId: existingPayment.id });
    }

    // Create payment record in database
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: user.id,
        groupId: groupId,
        contributionId: contributionId,
        amount: paymentAmount,
        currency: "XAF",
        status: PaymentStatus.PENDING,
        provider: resolvedProvider,
        phoneNumber: phoneNumber.replace(/\s/g, ""),
        retryCount: 0,
      },
    });

    // Initialize payment with provider
    const paymentFactory = PaymentFactory.getProvider(resolvedProvider as any);
    const externalId = paymentRecord.id;

    let paymentRequest;
    try {
      paymentRequest = await paymentFactory.requestToPay({
        amount: paymentAmount,
        phoneNumber: phoneNumber.replace(/\s/g, ""),
        externalId: externalId,
        description: `Payment for ${contribution.group.name}`,
      });
    } catch (providerError: any) {
      const providerErrorMessage = providerError?.message || "Provider request failed";

      await prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: PaymentStatus.FAILED,
          errorMessage: providerErrorMessage,
        },
      });

      paymentInitializationEvents.inc({ provider: String(resolvedProvider), result: "provider_error" });
      recordApiError("/api/payments/initialize", 500);
      logger.error("Payment initialization failed at provider", { paymentId: paymentRecord.id, provider: resolvedProvider, error: providerErrorMessage });

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "PAYMENT_INIT_ERROR",
            message: providerErrorMessage,
            details: { paymentId: paymentRecord.id },
          },
          timestamp: new Date(),
        },
        { status: 500 }
      );
    }

    // Update payment record with provider reference (prefer the provider's
    // own transaction id - needed for later status checks - falling back to
    // our locally-generated reference if the provider didn't return one)
    const providerRef = (paymentRequest as any).transactionId || (paymentRequest as any).referenceId;
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        providerRef: providerRef,
        status: PaymentStatus.PROCESSING,
      },
    });

    // Queue a safety retry check to avoid blocking API latency.
    await enqueuePaymentRetry({
      paymentId: paymentRecord.id,
      reason: "post_initialize_safety_check",
      requestedAt: new Date().toISOString(),
    });

    paymentInitializationEvents.inc({ provider: String(resolvedProvider), result: "success" });
    logger.info("Payment initialization succeeded", { paymentId: paymentRecord.id, provider: resolvedProvider });

    return NextResponse.json<ApiResponse<InitializePaymentResponse>>(
      {
        success: true,
        data: {
          paymentId: paymentRecord.id,
          referenceId: providerRef,
          provider: resolvedProvider as PaymentProvider,
          amount: paymentAmount,
          currency: "XAF",
          phoneNumber: phoneNumber.replace(/\s/g, ""),
          message: "Payment initialized. Check your phone for payment prompt.",
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Payment initialization error:", error);

    paymentInitializationEvents.inc({ provider: "unknown", result: "error" })
    recordApiError("/api/payments/initialize", 500)
    logger.error("Payment initialization error", { error: String(error) })
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "PAYMENT_INIT_ERROR",
          message: error.message || "Failed to initialize payment",
          details: process.env.NODE_ENV === "development" ? error.toString() : undefined,
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
