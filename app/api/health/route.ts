import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      service: "mbole-pay",
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}