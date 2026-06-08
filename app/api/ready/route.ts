import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const userCount = await prisma.user.count();

    return NextResponse.json(
      {
        success: true,
        status: "ready",
        checks: {
          database: "ok",
          users: userCount,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: "not-ready",
        error: error?.message || "Database check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}