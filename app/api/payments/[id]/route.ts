import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { PaymentFactory, mapProviderStatus } from "@/lib/payments/payment-factory";
import { ApiResponse, PaymentStatusResponse, PaymentStatus } from "@/types/payments";
import { userHasPermission } from "@/lib/rbac";

/**
 * GET /api/payments/[id]
 * Get single payment status and optionally check with provider for real-time updates
 *
 * Query parameters:
 * - refresh?: boolean - Force refresh status from provider (default: false)
 */
export async function GET(
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
    const refresh = new URL(request.url).searchParams.get("refresh") === "true";

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
        group: true,
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

    // Verify ownership
    if (payment.userId !== user.id) {
      // Check if user is treasurer+ with payment:view permission
      const groupId = (payment as any).group?.id;
      if (groupId) {
        const hasPermission = await userHasPermission(user.id, groupId, "payments:view");
        if (!hasPermission) {
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

    let currentStatus = payment.status;
    let currentProviderRef = payment.providerRef;
    let errorMessage = payment.errorMessage;

    // Optionally refresh status from provider
    if (refresh && payment.providerRef && payment.status !== "COMPLETED" && payment.status !== "FAILED") {
      try {
        const paymentFactory = PaymentFactory.getProvider(payment.provider as any);
        const providerStatus = await paymentFactory.getTransactionStatus(payment.providerRef) as any;
        const mappedStatus = mapProviderStatus(providerStatus.status);

        // Update status if it maps to something different from our current status
        if (mappedStatus && mappedStatus !== payment.status) {
          const updated = await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: mappedStatus,
              errorMessage: mappedStatus === PaymentStatus.FAILED ? "Payment failed at provider" : null,
            },
          });

          currentStatus = updated.status;
          errorMessage = updated.errorMessage;

          // If payment completed, update contribution
          if (mappedStatus === PaymentStatus.COMPLETED && payment.contributionId) {
            await prisma.contribution.update({
              where: { id: payment.contributionId },
              data: {
                status: "PAID",
                paidAt: new Date(),
              },
            });
          }
        }
      } catch (refreshError: any) {
        console.error("Error refreshing payment status:", refreshError);
        // Don't fail the request, just return current status
      }
    }

    const response: PaymentStatusResponse = {
      paymentId: payment.id,
      status: currentStatus as any,
      provider: payment.provider as any,
      referenceId: payment.id,
      providerRef: currentProviderRef || undefined,
      amount: payment.amount,
      currency: payment.currency,
      phoneNumber: payment.phoneNumber,
      errorMessage: errorMessage || undefined,
      updatedAt: payment.updatedAt,
    };

    return NextResponse.json<ApiResponse<PaymentStatusResponse>>(
      {
        success: true,
        data: response,
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Payment status error:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "STATUS_ERROR",
          message: "Failed to retrieve payment status",
          details: process.env.NODE_ENV === "development" ? error.toString() : undefined,
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/payments/[id]
 * Cancel a pending payment (only if status is PENDING)
 */
export async function DELETE(
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

    // Verify ownership
    if (payment.userId !== user.id) {
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

    // Only allow cancellation of PENDING payments
    if (payment.status !== "PENDING") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: `Cannot cancel payment with status ${payment.status}. Only PENDING payments can be cancelled.`,
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Update payment status to FAILED
    const cancelledPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        errorMessage: "Payment cancelled by user",
      },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: {
          paymentId: cancelledPayment.id,
          status: cancelledPayment.status,
          message: "Payment cancelled successfully",
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Payment cancellation error:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "CANCELLATION_ERROR",
          message: "Failed to cancel payment",
          details: process.env.NODE_ENV === "development" ? error.toString() : undefined,
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
