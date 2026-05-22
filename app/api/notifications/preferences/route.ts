import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const prefs = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    });

    // Return defaults if not found
    const defaults = {
      userId: session.user.id,
      emailPaymentSuccess: true,
      emailPaymentFailed: true,
      emailPayoutScheduled: true,
      emailDisputeFiled: true,
      emailVotingReminder: true,
      emailContributionReminder: true,
      smsPaymentSuccess: true,
      smsPaymentFailed: true,
      smsPayoutScheduled: true,
      smsDisputeFiled: false,
      smsVotingReminder: true,
      smsContributionReminder: true,
      notificationQuietHours: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      data: prefs || defaults,
    });
  } catch (error: any) {
    console.error("GET /api/notifications/preferences error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Failed to fetch preferences" },
      },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Update or create preferences
    const updated = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: body,
      create: {
        userId: session.user.id,
        ...body,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/notifications/preferences error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Failed to update preferences" },
      },
      { status: 500 }
    );
  }
}
