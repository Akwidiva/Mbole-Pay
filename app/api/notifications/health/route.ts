/**
 * Health Check API Endpoint
 * Check notification services status: /api/notifications/health
 */

import { NextRequest, NextResponse } from "next/server";
import { getNotificationFactory } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const factory = getNotificationFactory();

    // Check if services are configured
    const health = await factory.getHealthStatus();

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        services: {
          email: {
            operational: health.email.operational,
            quotaUsed: health.email.quota?.used ?? 0,
            quotaLimit: health.email.quota?.limit ?? 0,
            quotaPercentage:
              health.email.quota?.limit && health.email.quota?.used
                ? Math.round(
                    (health.email.quota.used / health.email.quota.limit) * 100
                  )
                : 0,
          },
        },
        warnings: getWarnings(health),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check error:", error);
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

/**
 * Generate warnings based on service status
 */
function getWarnings(health: any): string[] {
  const warnings: string[] = [];

  if (!health.email.operational) {
    warnings.push(
      "Email service is not operational. Check SendGrid credentials."
    );
  }

  if (health.email.quota && health.email.quota.used > health.email.quota.limit * 0.8) {
    warnings.push("Email quota usage is above 80%");
  }

  return warnings;
}
