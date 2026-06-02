/**
 * Test Notification API Endpoint
 * Send test notifications: POST /api/notifications/test
 *
 * Request body:
 * {
 *   "channel": "email",
 *   "email": "test@example.com",
 *   "type": "CONTRIBUTION_DUE"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import EmailService from "@/lib/notifications/email-service";

export async function POST(request: NextRequest) {
  try {
    // Check authentication (restrict to development or admin)
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    // Only allow in development environment
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Test endpoint only available in development" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { channel, email, templateType } = body;

    if (channel !== "email") {
      return NextResponse.json(
        { error: "Invalid channel. Use: email" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email address required for email channel" },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      results: {},
    };

    const emailService = new EmailService();
    const emailOk = await emailService.verifyCredentials();

    if (!emailOk) {
      results.results.email = {
        success: false,
        error: "Email credentials not configured or invalid",
      };
    } else {
      try {
        const response = await emailService.send({
          to: email,
          subject: "[TEST] Mbole Pay Notification",
          html: `
            <h2>Test Email from Mbole Pay</h2>
            <p>If you're seeing this, your email service is working correctly!</p>
            <p>Test Type: ${templateType || "General"}</p>
            <p>Sent at: ${new Date().toISOString()}</p>
            <hr>
            <p><small>This is a test email. No action needed.</small></p>
          `,
          text: `Test email from Mbole Pay. Sent at ${new Date().toISOString()}`,
        });

        results.results.email = response;
      } catch (error) {
        results.results.email = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    const allSuccess = Object.values(results.results).every(
      (r: any) => r.success !== false
    );

    return NextResponse.json(results, {
      status: allSuccess ? 200 : 207, // 207 Multi-Status if partial failure
    });
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
