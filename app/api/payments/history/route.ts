import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { ApiResponse, PaymentHistoryItem } from "@/types/payments";
import { userHasPermission } from "@/lib/rbac";

/**
 * GET /api/payments/history
 * Retrieve payment history for authenticated user
 *
 * Query parameters:
 * - groupId?: string - Filter by group
 * - status?: string - Filter by payment status (PENDING, PROCESSING, COMPLETED, FAILED)
 * - limit?: number - Number of results (default: 20, max: 100)
 * - offset?: number - Pagination offset (default: 0)
 * - sortBy?: "date" | "amount" - Sort field (default: date)
 * - sortOrder?: "asc" | "desc" - Sort order (default: desc)
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const sortBy = (url.searchParams.get("sortBy") || "date") as "date" | "amount";
    const sortOrder = (url.searchParams.get("sortOrder") || "desc") as "asc" | "desc";

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

    // Check permission to view payments
    // If groupId is specified, check payment:view permission for that group
    // If not, user can only view their own payment history
    if (groupId) {
      const hasPermission = await userHasPermission(user.id, groupId, "payments:view");
      if (!hasPermission) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission to view payments in this group",
            },
            timestamp: new Date(),
          },
          { status: 403 }
        );
      }
    }

    // Build filter
    const where: any = {
      userId: user.id,
    };

    if (groupId) {
      where.groupId = groupId;
    }

    if (status) {
      where.status = status;
    }

    // Determine sort field
    const sortField = sortBy === "amount" ? "amount" : "createdAt";

    // Fetch total count
    const totalCount = await prisma.payment.count({ where });

    // Fetch payments
    const payments = await prisma.payment.findMany({
      where,
      include: {
        group: {
          select: { name: true },
        },
      },
      orderBy: {
        [sortField]: sortOrder,
      },
      take: limit,
      skip: offset,
    });

    // Transform to history items
    const historyItems: PaymentHistoryItem[] = payments.map((payment: any) => ({
      id: payment.id,
      date: payment.createdAt,
      provider: payment.provider as any,
      amount: payment.amount,
      currency: payment.currency,
      phoneNumber: payment.phoneNumber,
      status: payment.status as any,
      description: payment.errorMessage || undefined,
      groupName: payment.group?.name,
    }));

    return NextResponse.json<ApiResponse<any>>(
      {
        success: true,
        data: {
          payments: historyItems,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount,
          },
          summary: {
            totalPaid: payments
              .filter((p: any) => p.status === "COMPLETED")
              .reduce((sum: number, p: any) => sum + p.amount, 0),
            totalPending: payments
              .filter((p: any) => p.status === "PENDING" || p.status === "PROCESSING")
              .reduce((sum: number, p: any) => sum + p.amount, 0),
            totalFailed: payments
              .filter((p: any) => p.status === "FAILED")
              .reduce((sum: number, p: any) => sum + p.amount, 0),
          },
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Payment history error:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "HISTORY_ERROR",
          message: "Failed to retrieve payment history",
          details: process.env.NODE_ENV === "development" ? error.toString() : undefined,
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
