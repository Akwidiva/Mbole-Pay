import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { PaymentFactory } from "@/lib/payments/payment-factory";
import { PaymentStatus, ApiResponse, InitializePaymentResponse } from "@/types/payments";
import { userHasPermission } from "@/lib/rbac";

/**
 * POST /api/payments/[id]/retry
 * Retry a failed payment
 *
 * Request body:
 * {
 *   phoneNumber?: string; // New phone number if different
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
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

    const paymentId = params.id;
    const body = await request.json();
    const { phoneNumber: newPhoneNumber } = body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
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

    // Get payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contribution: true,
      },
    });

    if (!payment) {
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

    // Check permission to retry payment
    // Users can retry their own payments, admins can retry any payment
    if (payment.userId !== user.id) {
      const contribution = payment.contribution as any;
      const groupId = contribution?.groupId;
      if (groupId) {
        const hasPermission = await userHasPermission(user.id, groupId, "payments:retry");
        if (!hasPermission) {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "You do not have permission to retry this payment",
              },
              timestamp: new Date(),
            },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "You do not have access to this payment",
            },
            timestamp: new Date(),
          },
          { status: 403 }
        );
      }
    }

    // Check retry limit
    if (payment.retryCount >= 3) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "MAX_RETRIES_EXCEEDED",
            message: "Maximum retry attempts (3) exceeded. Please contact support.",
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Only allow retry of FAILED or PENDING payments
    if (payment.status !== "FAILED" && payment.status !== "PENDING") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: `Cannot retry payment with status ${payment.status}. Only FAILED or PENDING payments can be retried.`,
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Validate new phone number if provided
    const phoneNumber = newPhoneNumber || payment.phoneNumber;
    const phoneRegex = /^(\+237|\+221)?[679]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ""))) {
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

    // Update payment to PROCESSING and increment retry count
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PROCESSING,
        phoneNumber: phoneNumber.replace(/\s/g, ""),
        retryCount: payment.retryCount + 1,
        lastRetry: new Date(),
        errorMessage: null,
      },
    });

    // Reinitialize payment with provider
    const paymentFactory = PaymentFactory.getProvider(payment.provider as any);

    const paymentRequest = await paymentFactory.requestToPay({
      amount: payment.amount,
      phoneNumber: phoneNumber.replace(/\s/g, ""),
      externalId: paymentId,
      description: `Retry payment for contribution`,
    });

    // Update with provider reference
    const providerRef = (paymentRequest as any).referenceId || (paymentRequest as any).transactionId;
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        providerRef: providerRef,
      },
    });

    return NextResponse.json<ApiResponse<InitializePaymentResponse>>(
      {
        success: true,
        data: {
          paymentId: updatedPayment.id,
          referenceId: providerRef,
          provider: payment.provider as any,
          amount: payment.amount,
          currency: payment.currency,
          phoneNumber: phoneNumber.replace(/\s/g, ""),
          message: `Payment retry initiated (Attempt ${payment.retryCount + 1}/3). Check your phone for payment prompt.`,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Payment retry error:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "RETRY_ERROR",
          message: "Failed to retry payment",
          details: process.env.NODE_ENV === "development" ? error.toString() : undefined,
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

