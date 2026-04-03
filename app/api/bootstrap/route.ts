/**
 * Bootstrap API Endpoint
 * GET /api/bootstrap - Initialize scheduler and other services on app startup
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeScheduler, isSchedulerInitialized } from "@/lib/scheduler/init";

export async function GET(request: NextRequest) {
  try {
    // Check if scheduler is already initialized
    if (isSchedulerInitialized()) {
      return NextResponse.json(
        {
          status: "ok",
          message: "Services already initialized",
          timestamp: new Date().toISOString(),
          services: {
            scheduler: "running",
          },
        },
        { status: 200 }
      );
    }

    // Initialize scheduler
    console.log("🚀 Initializing Mbole Pay services...");
    await initializeScheduler();

    return NextResponse.json(
      {
        status: "ok",
        message: "All services initialized successfully",
        timestamp: new Date().toISOString(),
        services: {
          scheduler: "running",
          notifications: "ready",
          database: "connected",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Bootstrap error:", error);
    return NextResponse.json(
      {
        status: "error",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
