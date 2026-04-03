/**
 * Scheduler Status API Endpoint
 * GET /api/scheduler/status - Get scheduler status and active jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getScheduler } from "@/lib/scheduler/notification-scheduler";

export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    // In production, also check for admin role
    // For now, allow any authenticated user in development
    if (process.env.NODE_ENV === "production") {
      // Check if user is admin (you'd need to add role to User model)
      // if (session.user?.role !== "ADMIN") {
      //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      // }
    }

    const scheduler = getScheduler();
    const status = scheduler.getStatus();

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        scheduler: {
          isRunning: status.isRunning,
          activeJobs: status.activeJobs,
          jobs: status.jobs.map((job) => ({
            name: job.name,
            lastRun: job.lastRun?.toISOString(),
            status: job.lastRun
              ? `Last run: ${job.lastRun.toLocaleString()}`
              : "Not yet run",
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Scheduler status error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
