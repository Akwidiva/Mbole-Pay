/**
 * Scheduler Trigger API Endpoint
 * POST /api/scheduler/trigger - Manually trigger a scheduled job
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getScheduler } from "@/lib/scheduler/notification-scheduler";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    // Only allow in development
    if (
      process.env.NODE_ENV === "production" &&
      process.env.ALLOW_MANUAL_TRIGGERS !== "true"
    ) {
      return NextResponse.json(
        {
          error:
            "Manual job triggering disabled in production. Set ALLOW_MANUAL_TRIGGERS=true to enable.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        {
          error: "jobId is required. Available jobs: contribution-due-reminder, overdue-alert, status-check, cleanup",
        },
        { status: 400 }
      );
    }

    const scheduler = getScheduler();
    const result = await scheduler.triggerJob(jobId);

    return NextResponse.json(
      {
        status: result.success ? "ok" : "error",
        timestamp: new Date().toISOString(),
        jobId,
        message: result.message,
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error) {
    console.error("Scheduler trigger error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET - List available jobs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        status: "ok",
        availableJobs: [
          {
            id: "contribution-due-reminder",
            name: "Contribution Due Reminder",
            description: "Send reminders for contributions due in 3 days",
            schedule: "Daily at 08:00 UTC",
          },
          {
            id: "overdue-alert",
            name: "Overdue Alert",
            description: "Send alerts for overdue contributions",
            schedule: "Daily at 09:00 UTC",
          },
          {
            id: "status-check",
            name: "Status Check",
            description: "Check and update contribution statuses",
            schedule: "Every 6 hours",
          },
          {
            id: "cleanup",
            name: "Data Cleanup",
            description: "Cleanup old notification records",
            schedule: "Daily at 02:00 UTC",
          },
        ],
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
