import { NextRequest, NextResponse } from "next/server"
import { runReminderTick } from "@/lib/services/reminder-service"

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await runReminderTick()
    return NextResponse.json({ ok: true, ran: new Date().toISOString() })
  } catch (err: any) {
    console.error("[cron][reminders]", err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
