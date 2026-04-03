import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types/payments";
import { userHasPermission } from "@/lib/rbac";

/**
 * GET /api/contributions/calendar
 * Get all contributions for a group with due dates for calendar view
 *
 * Query parameters:
 * - groupId: string (required) - The group ID to get contributions for
 * - month?: string - YYYY-MM format to filter by specific month
 * - year?: string - YYYY format to filter by specific year
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

    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId");
    const monthFilter = url.searchParams.get("month"); // YYYY-MM
    const yearFilter = url.searchParams.get("year"); // YYYY

    if (!groupId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "groupId is required",
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

    // Check permission to view contributions (requires contributions:view)
    const hasPermission = await userHasPermission(user.id, groupId, "contributions:view");
    if (!hasPermission) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to view contributions in this group",
          },
          timestamp: new Date(),
        },
        { status: 403 }
      );
    }

    // Build date filters
    let dateFilter: any = {};

    if (monthFilter) {
      // Filter by specific month (YYYY-MM)
      const [year, month] = monthFilter.split("-");
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);

      dateFilter = {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      };
    } else if (yearFilter) {
      // Filter by specific year
      const startDate = new Date(`${yearFilter}-01-01`);
      const endDate = new Date(parseInt(yearFilter), 11, 31, 23, 59, 59);

      dateFilter = {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    // Get all contributions for the group with optional date filter
    const contributions = await prisma.contribution.findMany({
      where: {
        groupId: groupId,
        ...dateFilter,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            provider: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Get group info
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        frequency: true,
        cycleType: true,
        contributionAmount: true,
      },
    });

    // Transform contributions into calendar events
    const events = contributions.map((contrib) => ({
      id: contrib.id,
      userId: contrib.userId,
      userName: contrib.user.name || contrib.user.email,
      userEmail: contrib.user.email,
      amount: contrib.amount,
      currency: "XAF",
      dueDate: contrib.dueDate,
      status: contrib.status,
      paidAt: contrib.paidAt,
      isOverdue: contrib.dueDate < new Date() && contrib.status !== "PAID",
      paymentId: contrib.payment?.id,
      paymentStatus: contrib.payment?.status,
      paymentProvider: contrib.payment?.provider,
    }));

    // Group contributions by due date
    const eventsByDate: Record<string, typeof events> = {};
    events.forEach((event) => {
      const dateKey = event.dueDate.toISOString().split("T")[0];
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });

    // Calculate statistics
    const stats = {
      totalContributions: contributions.length,
      paidContributions: contributions.filter((c) => c.status === "PAID").length,
      pendingContributions: contributions.filter((c) => c.status === "PENDING").length,
      overdueContributions: contributions.filter(
        (c) => c.dueDate < new Date() && c.status !== "PAID"
      ).length,
      totalAmount: contributions.reduce((sum, c) => sum + c.amount, 0),
      paidAmount: contributions
        .filter((c) => c.status === "PAID")
        .reduce((sum, c) => sum + c.amount, 0),
      pendingAmount: contributions
        .filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + c.amount, 0),
      overdueAmount: contributions
        .filter((c) => c.dueDate < new Date() && c.status !== "PAID")
        .reduce((sum, c) => sum + c.amount, 0),
    };

    return NextResponse.json<ApiResponse<any>>(
      {
        success: true,
        data: {
          group,
          contributions: events,
          eventsByDate,
          stats,
          period: {
            month: monthFilter,
            year: yearFilter,
          },
        },
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Calendar API error:", error);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: {
          code: "CALENDAR_ERROR",
          message: "Failed to retrieve calendar data",
          details: process.env.NODE_ENV === "development" ? error.toString() : undefined,
        },
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
