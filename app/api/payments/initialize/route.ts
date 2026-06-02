import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/db";
import { PaymentFactory } from "@/lib/payments/payment-factory";
import { PaymentStatus, PaymentProvider, ApiResponse, InitializePaymentResponse } from "@/types/payments";
import { userHasPermission } from "@/lib/rbac";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

    const body = await request.json();
    const { groupId, contributionId, phoneNumber, provider, amount } = body;

    // Validation
    if (!groupId || !contributionId || !phoneNumber) {
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

    const resolvedProvider = provider || PaymentProvider.MTN_MOMO;

    if (resolvedProvider !== PaymentProvider.MTN_MOMO) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "INVALID_PROVIDER",
            message: "Only MTN MoMo is supported for payments",
          },
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Validate phone number format
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

    // Check permission to make payments (requires payments:create)
    const hasPermission = await userHasPermission(user.id, groupId, "payments:create");
    if (!hasPermission) {
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

    // Check for duplicate pending payments
    const existingPayment = await prisma.payment.findFirst({
      where: {
        contributionId: contributionId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (existingPayment) {
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

    // Create payment record in database
    const paymentRecord = await prisma.payment.create({
      data: {
        userId: user.id,
        groupId: groupId,
        contributionId: contributionId,
        amount: paymentAmount,
        currency: "XAF",
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.MTN_MOMO,
        phoneNumber: phoneNumber.replace(/\s/g, ""),
        retryCount: 0,
      },
    });

    // Initialize payment with provider
    const paymentFactory = PaymentFactory.getProvider(PaymentProvider.MTN_MOMO);
    const externalId = paymentRecord.id;

    const paymentRequest = await paymentFactory.requestToPay({
      amount: paymentAmount,
      phoneNumber: phoneNumber.replace(/\s/g, ""),
      externalId: externalId,
      description: `Payment for ${contribution.group.name}`,
    });

    // Update payment record with provider reference
    const providerRef = (paymentRequest as any).referenceId || (paymentRequest as any).transactionId;
    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        providerRef: providerRef,
        status: PaymentStatus.PROCESSING,
      },
    });

    return NextResponse.json<ApiResponse<InitializePaymentResponse>>(
      {
        success: true,
        data: {
          paymentId: paymentRecord.id,
          referenceId: providerRef,
          provider: provider,
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
