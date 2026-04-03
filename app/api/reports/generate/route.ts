/**
 * Report Generation API Route
 * POST /api/reports/generate
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { getReportFactory } from "@/lib/reports/report-factory";
import { ReportOptions, ReportType, ExportFormat } from "@/types/reports";
import { userHasPermission, getUserGroupRole } from "@/lib/rbac";

interface GenerateReportRequest {
  reportType: ReportType;
  format: ExportFormat;
  groupId?: string;
  userId?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: GenerateReportRequest = await request.json();

    // Validate request
    if (!body.reportType || !body.format) {
      return NextResponse.json(
        { error: "Missing required fields: reportType, format" },
        { status: 400 }
      );
    }

    // Validate report type
    if (!Object.values(ReportType).includes(body.reportType)) {
      return NextResponse.json(
        { error: `Invalid report type: ${body.reportType}` },
        { status: 400 }
      );
    }

    // Validate export format
    if (!Object.values(ExportFormat).includes(body.format)) {
      return NextResponse.json(
        { error: `Invalid export format: ${body.format}` },
        { status: 400 }
      );
    }

    // Authorization: Check group access if groupId provided
    if (body.groupId) {
      const groupMembership = await prisma.membership.findUnique({
        where: {
          userId_groupId: {
            groupId: body.groupId,
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

      // Check permission to generate reports
      const hasPermission = await userHasPermission(user.id, body.groupId, "reports:generate");
      if (!hasPermission) {
        return NextResponse.json(
          {
            error: "Unauthorized: You do not have permission to generate reports for this group",
          },
          { status: 403 }
        );
      }
    }

    // Authorization: Can only view own individual statement
    if (
      body.reportType === ReportType.INDIVIDUAL_STATEMENT &&
      body.userId &&
      body.userId !== user.id
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Can only view your own statement" },
        { status: 403 }
      );
    }

    // Prepare report options
    const reportOptions: ReportOptions = {
      reportType: body.reportType,
      format: body.format,
      groupId: body.groupId || user.id,
      userId: body.userId || user.id,
      dateRange: body.dateRange as any,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    };

    console.log(
      `[Reports] Generating ${body.reportType} report for user ${user.id}`,
      reportOptions
    );

    // Generate report
    const reportFactory = getReportFactory();
    const result = await reportFactory.generateReport(reportOptions);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to generate report",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reportType: result.reportType,
      format: result.format,
      fileName: result.fileName,
      fileSize: result.fileSize,
      generatedAt: result.generatedAt,
      duration: result.duration,
      message: "Report generated successfully",
    });
  } catch (error) {
    console.error("[Reports API Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/generate
 * Get available report types and formats
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const reportFactory = getReportFactory();
    const availableReports = reportFactory.getAvailableReports();

    return NextResponse.json({
      success: true,
      reports: availableReports,
      formats: Object.values(ExportFormat),
      dateRanges: [
        "THIS_MONTH",
        "LAST_MONTH",
        "THIS_QUARTER",
        "THIS_YEAR",
        "LAST_30_DAYS",
        "LAST_90_DAYS",
        "ALL_TIME",
        "CUSTOM",
      ],
    });
  } catch (error) {
    console.error("[Reports API Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
