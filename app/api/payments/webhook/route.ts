import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PaymentFactory } from "@/lib/payments/payment-factory";
import { PaymentStatus, PaymentProvider, ApiResponse } from "@/types/payments";
import crypto from "crypto";

/**
 * POST /api/payments/webhook
 * Webhook endpoint for receiving payment callbacks from MTN Momo and Orange Money
 *
 * Both providers will POST updates to this endpoint with transaction status changes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine which provider sent the webhook
    let provider: PaymentProvider;
    let externalId: string;
    let transactionStatus: string;
    let transactionId: string;

    // Detect provider by payload structure
    if (body.transactionStatus || body.payer) {
      // MTN Momo webhook format
      provider = PaymentProvider.MTN_MOMO;
      externalId = body.externalId;
      transactionStatus = body.transactionStatus;
      transactionId = body.transactionId;
    } else if (body.status && body.phoneNumber && body.source !== "fapshi") {
      // Orange Money webhook format
      provider = PaymentProvider.ORANGE_MONEY;
      externalId = body.externalId;
      transactionStatus = body.status;
      transactionId = body.transactionId;

      // Verify webhook signature for Orange Money
      const signature = body.signature;
      const secretKey = process.env.ORANGE_MONEY_API_SECRET || "";
      const payload = JSON.stringify(body);
      const expectedSignature = crypto
        .createHmac("sha256", secretKey)
        .update(payload)
        .digest("hex");

      if (signature !== expectedSignature) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: "INVALID_SIGNATURE",
              message: "Webhook signature verification failed",
            },
            timestamp: new Date(),
          },
          { status: 401 }
        );
      }
    } else if (body.source === "fapshi" || body.fapshi_transaction_id || body.gateway === "fapshi" || request.headers.get("x-fapshi-signature")) {
      // Fapshi webhook assumed format
      provider = PaymentProvider.FAPSHI;
      // Fapshi may include an external_id or reference; try common fields
      externalId = body.external_id || body.externalId || body.reference || body.payment_id || body.paymentId;
      transactionStatus = body.status || body.transaction_status || body.state;
      transactionId = body.fapshi_transaction_id || body.id || body.transaction_id || body.transactionId;

      // Optional: verify signature if FAPSHI_SECRET configured
      const fSignature = request.headers.get("x-fapshi-signature") || body.signature;
      const fSecret = process.env.FAPSHI_WEBHOOK_SECRET || "";
      if (fSecret && fSignature) {
        const payload = JSON.stringify(body);
        const expected = crypto.createHmac("sha256", fSecret).update(payload).digest("hex");
        if (expected !== fSignature) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: { code: "INVALID_SIGNATURE", message: "Fapshi webhook signature mismatch" },
              timestamp: new Date(),
            },
            { status: 401 }
          );
        }
      }
    } else {
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
      console.warn(`Payment not found for externalId: ${externalId}`);
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
      console.warn(
        `Provider mismatch: payment has ${payment.provider}, webhook from ${provider}`
      );
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
      case "COMPLETED":
        updatedStatus = PaymentStatus.COMPLETED;
        break;
      case "FAILED":
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

    // If payment completed, update contribution status
    if (updatedStatus === PaymentStatus.COMPLETED && payment.contributionId) {
      await prisma.contribution.update({
        where: { id: payment.contributionId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      console.log(
        `Contribution ${payment.contributionId} marked as PAID for user ${payment.userId}`
      );
    }

    // If payment failed, increment retry count and log error
    if (updatedStatus === PaymentStatus.FAILED) {
      const newRetryCount = payment.retryCount + 1;
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          retryCount: newRetryCount,
          lastRetry: new Date(),
        },
      });

      if (newRetryCount >= 3) {
        console.error(
          `Payment ${payment.id} failed after 3 retries. Manual intervention needed.`
        );
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
    console.error("Webhook processing error:", error);

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
