import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { PaymentStatus } from "@/types/payments"
import { triggerPayoutIfComplete, payoutOrderedMemberships } from "@/lib/services/payout-service"

// POST /api/groups/[id]/cycle/confirm-offset
// Used when the current user IS the payout recipient for this cycle.
// Their contribution is offset against their incoming payout — no Fapshi call needed.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  })
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: { orderBy: { createdAt: "asc" } },
    },
  })
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 })

  // Verify the caller is the cycle recipient (using same rotation order as payout-service)
  const ordered = payoutOrderedMemberships(group.memberships)
  let isRecipient = false
  if (group.payoutOrder === "SEQUENTIAL") {
    const idx = group.currentRecipientIndex % ordered.length
    isRecipient = ordered[idx]?.userId === user.id
  } else {
    const payout = await prisma.payout.findFirst({ where: { groupId, cycle: group.currentCycle } })
    isRecipient = payout?.recipientId === user.id
  }

  if (!isRecipient) {
    return NextResponse.json({ error: "You are not the recipient for this cycle" }, { status: 403 })
  }

  const contribution = await prisma.contribution.findFirst({
    where: { groupId, cycle: group.currentCycle, userId: user.id },
  })
  if (!contribution) return NextResponse.json({ error: "Contribution not found" }, { status: 404 })

  if (contribution.status === "PAID") {
    return NextResponse.json({ data: { message: "Already confirmed" } })
  }

  // Mark contribution PAID — no money moves, it's offset against the payout
  await prisma.contribution.update({
    where: { id: contribution.id },
    data: { status: "PAID", paidAt: new Date() },
  })

  // Create an audit payment record so the history is complete
  await prisma.payment.create({
    data: {
      userId: user.id,
      groupId,
      contributionId: contribution.id,
      amount: contribution.amount,
      currency: "XAF",
      status: PaymentStatus.COMPLETED,
      provider: "FAPSHI",
      phoneNumber: user.phone || "",
      providerRef: `offset-${contribution.id}`,
      retryCount: 0,
    },
  })

  // Check if all members have now paid — trigger payout if so
  triggerPayoutIfComplete(groupId, group.currentCycle).catch((err) =>
    console.error("[confirm-offset] payout trigger failed:", err.message)
  )

  return NextResponse.json({ data: { message: "Contribution confirmed as offset against your payout" } })
}
