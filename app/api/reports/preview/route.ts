/**
 * Report Preview API Route
 * GET /api/reports/preview?groupId=X&userId=Y&reportType=Z&dateRange=W
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { getReportFactory } from "@/lib/reports/report-factory";
import { ReportOptions, ReportType, ExportFormat } from "@/types/reports";
import { userHasPermission } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const userId = searchParams.get("userId");
    const reportType = searchParams.get("reportType") as ReportType;
    const dateRange = searchParams.get("dateRange");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!reportType) {
      return NextResponse.json(
        { error: "Missing required parameter: reportType" },
        { status: 400 }
      );
    }

    // Authorization: Check group access if groupId provided
    if (groupId) {
      const groupMembership = await prisma.membership.findUnique({
        where: {
          userId_groupId: {
            groupId,
            userId: user.id,
          },
        },
      });

      if (!groupMembership) {
        return NextResponse.json(
          { error: "Unauthorized: Not a member of this group" },
          { status: 403 }
        );
      }

      // Check permission to view reports
      const hasPermission = await userHasPermission(user.id, groupId, "reports:view");
      if (!hasPermission) {
        return NextResponse.json(
          {
            error: "Unauthorized: You do not have permission to view reports for this group",
          },
          { status: 403 }
        );
      }
    }

    // Authorization: Can only preview own individual statement
    if (
      reportType === ReportType.INDIVIDUAL_STATEMENT &&
      userId &&
      userId !== user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Can only preview your own statement" },
        { status: 403 }
      );
    }

    // Prepare report options
    const reportOptions: ReportOptions = {
      reportType,
      format: ExportFormat.JSON,
      groupId: groupId || user.id,
      userId: userId || user.id,
      dateRange: dateRange as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    console.log(
      `[Reports Preview] Getting preview for ${reportType} report`,
      reportOptions
    );

    // Get report preview
    const reportFactory = getReportFactory();
    const preview = await reportFactory.getReportPreview(reportOptions);

    return NextResponse.json({
      success: true,
      reportType,
      preview,
    });
  } catch (error) {
    console.error("[Reports Preview API Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
