import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { PaymentFactory } from "@/lib/payments/payment-factory"
import { notifyPayoutCompleted, notifyContributorsPayoutComplete } from "@/lib/services/reminder-service"
import { recordContributionOnChain, recordCycleOnChain } from "@/lib/blockchain/factory"
import { payoutOrderedMemberships } from "@/lib/services/payout-service"

/**
 * POST /api/admin/deferred-payouts/[payoutId]
 * Manually release a FAILED or HELD payout — admin only.
 * Used when a payout was stuck (e.g. payout API not yet activated) and needs
 * to be re-fired after the underlying issue is resolved.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

  const payout = await prisma.payout.findUnique({
    where: { id: params.payoutId },
    include: {
      recipient: { select: { id: true, name: true, email: true, phone: true } },
      group: {
        include: {
          memberships: {
            include: { user: { select: { id: true, name: true, email: true, phone: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })

  if (!payout) {
    return NextResponse.json({ success: false, error: "Payout not found" }, { status: 404 })
  }

  // Verify the caller is an admin of this group or a system admin
  const isSystemAdmin = user.role === "ADMIN"
  if (!isSystemAdmin) {
    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: payout.groupId } },
    })
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
  }

  if (payout.status === "COMPLETED") {
    return NextResponse.json({ success: false, error: "Payout already completed" }, { status: 409 })
  }

  if (payout.status === "PROCESSING") {
    return NextResponse.json({ success: false, error: "Payout already processing — wait for webhook or try again in a minute" }, { status: 409 })
  }

  // Mark as PROCESSING before calling Fapshi
  await prisma.payout.update({
    where: { id: payout.id },
    data: {
      status: "PROCESSING",
      retryCount: (payout.retryCount ?? 0) + 1,
      lastRetry: new Date(),
      errorMessage: null,
    },
  })

  try {
    const fapshi = PaymentFactory.getProvider("FAPSHI" as any)
    await fapshi.transfer({
      amount: payout.amount,
      phoneNumber: payout.phoneNumber,
      externalId: `payout-${payout.groupId}-cycle-${payout.cycle}`,
      description: `Njangi payout — ${payout.group.name} cycle ${payout.cycle} (manual release)`,
    })

    // Mark COMPLETED and advance the group cycle
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: "COMPLETED", processedDate: new Date() },
    })

    const memberCount = payout.group.memberships.length
    const ordered = payoutOrderedMemberships(payout.group.memberships)
    const currentIdx = payout.group.currentRecipientIndex
    const nextIdx = (currentIdx + 1) % memberCount

    await prisma.group.update({
      where: { id: payout.groupId },
      data: {
        currentCycle: payout.group.currentCycle + 1,
        currentRecipientIndex: nextIdx,
      },
    })

    // Fire notifications + blockchain (non-blocking)
    notifyPayoutCompleted({
      userId: payout.recipient.id,
      userEmail: payout.recipient.email,
      amount: payout.amount,
      groupId: payout.groupId,
      groupName: payout.group.name,
    }).catch(() => {})

    notifyContributorsPayoutComplete({
      groupId: payout.groupId,
      groupName: payout.group.name,
      cycle: payout.cycle,
      totalPool: payout.amount,
      recipientName: payout.recipient.name ?? undefined,
    }).catch(() => {})

    const contributions = await prisma.contribution.findMany({
      where: { groupId: payout.groupId, cycle: payout.cycle, status: "PAID" },
    })
    for (const c of contributions) {
      recordContributionOnChain({
        dbGroupId: payout.groupId,
        cycle: payout.cycle,
        dbMemberId: c.userId,
        amount: c.amount,
        isRecipientOffset: false,
      }).catch(() => {})
    }
    recordCycleOnChain({
      dbGroupId: payout.groupId,
      cycle: payout.cycle,
      dbRecipientId: payout.recipientId,
      amount: payout.amount,
      memberCount,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: {
        payoutId: payout.id,
        status: "COMPLETED",
        amount: payout.amount,
        recipient: payout.recipient.name ?? payout.recipient.email,
        message: `XAF ${payout.amount.toLocaleString()} sent to ${payout.recipient.phone}`,
      },
    })
  } catch (err: any) {
    // Roll back to FAILED so the cron or next manual attempt can retry
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: "FAILED", errorMessage: err.message },
    })
    return NextResponse.json(
      { success: false, error: `Transfer failed: ${err.message}` },
      { status: 502 }
    )
  }
}
