import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { PaymentFactory } from "@/lib/payments/payment-factory"
import { notifyPayoutHeld } from "@/lib/services/reminder-service"

const MAX_PAYOUT_RETRIES = 3

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results = { checked: 0, retried: 0, held: 0, skipped: 0 }

  try {
    const failedPayouts = await prisma.payout.findMany({
      where: { status: "FAILED" },
      include: {
        recipient: { select: { id: true, email: true, name: true } },
        group: { select: { id: true, name: true } },
      },
      take: 20,
    })

    results.checked = failedPayouts.length

    for (const payout of failedPayouts) {
      const retryCount = payout.retryCount ?? 0

      if (retryCount >= MAX_PAYOUT_RETRIES) {
        // Move to HELD — all retries exhausted
        await prisma.payout.update({
          where: { id: payout.id },
          data: { status: "HELD", escrowReason: "Automatic payout failed after 3 retries — manual release required" },
        })
        notifyPayoutHeld({
          recipientId: payout.recipient.id,
          recipientEmail: payout.recipient.email,
          recipientName: payout.recipient.name ?? undefined,
          groupId: payout.group.id,
          groupName: payout.group.name,
          amount: payout.amount,
          payoutId: payout.id,
        }).catch(() => {})
        results.held++
        continue
      }

      try {
        const fapshi = PaymentFactory.getProvider("FAPSHI" as any)
        await prisma.payout.update({
          where: { id: payout.id },
          data: { status: "PROCESSING", retryCount: retryCount + 1, lastRetry: new Date() },
        })

        await fapshi.transfer({
          amount: payout.amount,
          phoneNumber: payout.phoneNumber,
          externalId: `payout-${payout.groupId}-cycle-${payout.cycle}-retry-${retryCount + 1}`,
          description: `Njangi payout — ${payout.group.name} cycle ${payout.cycle}`,
        })

        await prisma.payout.update({ where: { id: payout.id }, data: { status: "COMPLETED", processedDate: new Date() } })
        results.retried++
      } catch (err: any) {
        await prisma.payout.update({ where: { id: payout.id }, data: { status: "FAILED", errorMessage: err.message } })
        console.error("[cron][payout-retry] retry failed", payout.id, err.message)
        results.skipped++
      }
    }

    return NextResponse.json({ ok: true, ...results, ran: new Date().toISOString() })
  } catch (err: any) {
    console.error("[cron][payout-retry]", err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
