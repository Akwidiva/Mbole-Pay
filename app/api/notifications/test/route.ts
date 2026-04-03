/**
 * Test Notification API Endpoint
 * Send test notifications: POST /api/notifications/test
 *
 * Request body:
 * {
 *   "channel": "email" | "sms" | "both",
 *   "email": "test@example.com",
 *   "phone": "+1234567890",
 *   "type": "CONTRIBUTION_DUE"
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "next-auth/react";
import { getServerSession } from "next-auth";
import EmailService from "@/lib/notifications/email-service";
import SmsService from "@/lib/notifications/sms-service";

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
    const { channel, email, phone, templateType } = body;

    if (!channel || !["email", "sms", "both"].includes(channel)) {
      return NextResponse.json(
        { error: "Invalid channel. Use: email, sms, or both" },
        { status: 400 }
      );
    }

    if (channel === "email" && !email) {
      return NextResponse.json(
        { error: "Email address required for email channel" },
        { status: 400 }
      );
    }

    if ((channel === "sms" || channel === "both") && !phone) {
      return NextResponse.json(
        { error: "Phone number required for SMS channel" },
        { status: 400 }
      );
    }

    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      results: {},
    };

    // Test Email
    if (channel === "email" || channel === "both") {
      const emailService = new EmailService();
      const emailOk = await emailService.verifyCredentials();

      if (!emailOk) {
        results.results.email = {
          success: false,
          error: "SendGrid credentials not configured or invalid",
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
    }

    // Test SMS
    if (channel === "sms" || channel === "both") {
      const smsService = new SmsService();
      const smsOk = await smsService.verifyCredentials();

      if (!smsOk) {
        results.results.sms = {
          success: false,
          error: "Twilio credentials not configured or invalid",
        };
      } else {
        try {
          const response = await smsService.send({
            phoneNumber: phone,
            message: `[TEST] Mbole Pay notification test. Sent at ${new Date().toLocaleTimeString()}. This is a test message.`,
          });

          results.results.sms = response;
        } catch (error) {
          results.results.sms = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
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
