import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notificationEventHandler, NotificationEvent } from "@/lib/services/notification-event-handler";

// POST /api/notifications/send - Send notification (admin/system only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, userId, groupId, data } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: { message: "Notification type is required" } },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = [
      "PAYMENT_SUCCESS",
      "PAYMENT_FAILED",
      "PAYOUT_SCHEDULED",
      "DISPUTE_FILED",
      "VOTING_REMINDER",
      "CONTRIBUTION_REMINDER",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid notification type" } },
        { status: 400 }
      );
    }

    const event: NotificationEvent = {
      type: type as any,
      userId,
      groupId,
      data: data || {},
    };

    // Handle event asynchronously (don't wait)
    notificationEventHandler.handleEvent(event).catch(console.error);

    return NextResponse.json(
      {
        success: true,
        data: { message: "Notification queued for sending" },
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("POST /api/notifications/send error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Failed to send notification" },
      },
      { status: 500 }
    );
  }
}
