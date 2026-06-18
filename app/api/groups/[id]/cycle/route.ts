import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { payoutOrderedMemberships } from "@/lib/services/payout-service"
import { recordContributionOnChain } from "@/lib/blockchain/factory"

// GET /api/groups/[id]/cycle
// Returns current cycle state: recipient, each member's contribution status, progress
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      memberships: {
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 })

  const memberCount = group.memberships.length

  // Determine current recipient based on payout order
  const orderedMemberships = payoutOrderedMemberships(group.memberships)
  let recipient = null
  if (group.payoutOrder === "SEQUENTIAL") {
    const idx = group.currentRecipientIndex % memberCount
    recipient = orderedMemberships[idx]?.user ?? null
  } else {
    // LOTTERY: recipient is stored via the payout record for this cycle
    const payout = await prisma.payout.findFirst({
      where: { groupId, cycle: group.currentCycle },
      include: { recipient: { select: { id: true, name: true, email: true, phone: true } } },
    })
    recipient = payout?.recipient ?? null
  }

  // Get contributions for the current cycle
  const contributions = await prisma.contribution.findMany({
    where: { groupId, cycle: group.currentCycle },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  })

  const myContribution = contributions.find((c) => c.userId === user.id) ?? null
  const paidCount = contributions.filter((c) => c.status === "PAID").length
  const totalPool = group.contributionAmount * memberCount

  // Tell the UI if the current user is the recipient so it can show the offset button
  const isRecipient = recipient ? recipient.id === user.id : false

  // Check if payout was already triggered this cycle
  const payoutRecord = await prisma.payout.findFirst({
    where: { groupId, cycle: group.currentCycle },
  })

  return NextResponse.json({
    data: {
      currentCycle: group.currentCycle,
      recipient,
      contributions: contributions.map((c) => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        userEmail: c.user.email,
        amount: c.amount,
        status: c.status,
        paidAt: c.paidAt,
      })),
      myContribution: myContribution
        ? { id: myContribution.id, status: myContribution.status, amount: myContribution.amount }
        : null,
      cycleStarted: contributions.length > 0,
      paidCount,
      totalCount: memberCount,
      totalPool,
      payoutTriggered: !!payoutRecord,
      payoutStatus: payoutRecord?.status ?? null,
      isAdmin: membership.role === "ADMIN",
      isRecipient,
      myPhone: user.phone,
    },
  })
}

// POST /api/groups/[id]/cycle
// Admin starts a new cycle — creates Contribution records for all active members
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  })
  if (membership?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admin can start a cycle" }, { status: 403 })
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 })

  // Check no active contributions exist for current cycle already
  const existing = await prisma.contribution.findFirst({
    where: { groupId, cycle: group.currentCycle },
  })
  if (existing) {
    return NextResponse.json({ error: "Cycle already started" }, { status: 409 })
  }

  // Determine due date based on frequency
  const dueDate = new Date()
  switch (group.frequency) {
    case "WEEKLY":    dueDate.setDate(dueDate.getDate() + 7); break
    case "BIWEEKLY":  dueDate.setDate(dueDate.getDate() + 14); break
    case "MONTHLY":   dueDate.setMonth(dueDate.getMonth() + 1); break
    case "QUARTERLY": dueDate.setMonth(dueDate.getMonth() + 3); break
    default:          dueDate.setMonth(dueDate.getMonth() + 1)
  }

  // Determine recipient before creating contributions
  const ordered = payoutOrderedMemberships(group.memberships)
  const nonAdminCount = ordered.filter((m) => m.role !== "ADMIN").length
  let recipientUserId: string

  if (group.payoutOrder === "LOTTERY") {
    const eligibleCount = nonAdminCount > 0 ? nonAdminCount : ordered.length
    recipientUserId = ordered[Math.floor(Math.random() * eligibleCount)].userId
  } else {
    const idx = group.currentRecipientIndex % ordered.length
    recipientUserId = ordered[idx].userId
  }

  // Create contributions — recipient's is immediately PAID (their share is offset
  // against the payout they receive; no Fapshi payment needed)
  await prisma.contribution.createMany({
    data: group.memberships.map((m) => ({
      userId: m.userId,
      groupId,
      amount: group.contributionAmount,
      cycle: group.currentCycle,
      status: m.userId === recipientUserId ? "PAID" : "PENDING",
      paidAt: m.userId === recipientUserId ? new Date() : null,
      dueDate,
    })),
  })

  // Audit payment record for the recipient's auto-confirmed contribution
  const recipientContribution = await prisma.contribution.findFirst({
    where: { groupId, cycle: group.currentCycle, userId: recipientUserId },
  })
  if (recipientContribution) {
    await prisma.payment.create({
      data: {
        userId: recipientUserId,
        groupId,
        contributionId: recipientContribution.id,
        amount: group.contributionAmount,
        currency: "XAF",
        status: "COMPLETED",
        provider: "FAPSHI",
        phoneNumber: group.memberships.find((m) => m.userId === recipientUserId)?.user.phone || "",
        providerRef: `recipient-offset-${recipientContribution.id}`,
        retryCount: 0,
      },
    })

    // Record offset contribution on-chain (non-blocking)
    recordContributionOnChain({
      dbGroupId: groupId,
      cycle: group.currentCycle,
      dbMemberId: recipientUserId,
      amount: group.contributionAmount,
      isRecipientOffset: true,
    }).catch((err) => console.warn("[blockchain] contribution record failed (non-fatal):", err.message))
  }

  // For LOTTERY: store the pre-selected recipient as a scheduled payout
  if (group.payoutOrder === "LOTTERY") {
    const recipientMembership = group.memberships.find((m) => m.userId === recipientUserId)!
    await prisma.payout.create({
      data: {
        groupId,
        recipientId: recipientUserId,
        amount: group.contributionAmount * group.memberships.length,
        currency: "XAF",
        status: "SCHEDULED",
        provider: "FAPSHI",
        phoneNumber: recipientMembership.user.phone || "",
        scheduledDate: dueDate,
        cycle: group.currentCycle,
      },
    })
  }

  return NextResponse.json({
    data: {
      cycle: group.currentCycle,
      memberCount: group.memberships.length,
      dueDate,
      message: "Cycle started — contributions created for all members",
    },
  })
}
