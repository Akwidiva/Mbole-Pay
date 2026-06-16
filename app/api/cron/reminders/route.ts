import { NextRequest, NextResponse } from "next/server"
import { runReminderTick } from "@/lib/services/reminder-service"

// Called hourly by Vercel Cron or an external scheduler.
// Secured by a shared secret in the Authorization header.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (process.env.NODE_ENV === "production" && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await runReminderTick()
    return NextResponse.json({ ok: true, ran: new Date().toISOString() })
  } catch (err) {
    console.error("[cron/reminders]", err)
    return NextResponse.json({ error: "Reminder tick failed" }, { status: 500 })
  }
}
