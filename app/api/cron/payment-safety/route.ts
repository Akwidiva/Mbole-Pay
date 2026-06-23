import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { PaymentFactory, mapProviderStatus } from "@/lib/payments/payment-factory"
import { PaymentStatus } from "@/types/payments"
import { notifyMemberDelinquent } from "@/lib/services/reminder-service"
import { triggerPayoutIfComplete } from "@/lib/services/payout-service"

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results = { checked: 0, completed: 0, failed: 0, skipped: 0 }

  try {
    // Find payments stuck in PENDING/PROCESSING for more than 3 minutes
    const cutoff = new Date(Date.now() - 3 * 60 * 1000)
    const stuckPayments = await prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
        createdAt: { lt: cutoff },
        providerRef: { not: null },
      },
      include: { contribution: true },
      take: 50,
    })

    results.checked = stuckPayments.length

    for (const payment of stuckPayments) {
      try {
        const provider = PaymentFactory.getProvider(payment.provider as any)
        const result = await provider.getTransactionStatus(payment.providerRef!)
        const mapped = mapProviderStatus(String(result?.status || "").toUpperCase())

        if (mapped === PaymentStatus.COMPLETED) {
          await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.COMPLETED } })

          if (payment.contributionId) {
            const contribution = await prisma.contribution.update({
              where: { id: payment.contributionId },
              data: { status: "PAID", paidAt: new Date() },
            })
            triggerPayoutIfComplete(payment.groupId, contribution.cycle).catch(() => {})
          }
          results.completed++
        } else if (mapped === PaymentStatus.FAILED) {
          const newRetryCount = (payment.retryCount ?? 0) + 1
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.FAILED, errorMessage: "Payment timed out — no confirmation received", retryCount: newRetryCount },
          })

          // FR-08: after 3 failures mark member delinquent
          if (newRetryCount >= 3 && payment.groupId && payment.userId) {
            const membership = await prisma.membership.findUnique({
              where: { userId_groupId: { userId: payment.userId, groupId: payment.groupId } },
              include: {
                user: { select: { id: true, email: true, name: true } },
                group: { select: { id: true, name: true } },
              },
            })
            if (membership && !membership.isDelinquent) {
              await prisma.membership.update({ where: { id: membership.id }, data: { isDelinquent: true, delinquentAt: new Date() } })
              notifyMemberDelinquent({
                userId: membership.user.id,
                userEmail: membership.user.email,
                userName: membership.user.name ?? undefined,
                groupId: membership.group.id,
                groupName: membership.group.name,
                failedAmount: payment.amount,
              }).catch(() => {})
            }
          }
          results.failed++
        } else {
          results.skipped++
        }
      } catch (err) {
        console.error("[cron][payment-safety] error checking payment", payment.id, err)
        results.skipped++
      }
    }

    return NextResponse.json({ ok: true, ...results, ran: new Date().toISOString() })
  } catch (err: any) {
    console.error("[cron][payment-safety]", err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
