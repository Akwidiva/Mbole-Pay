import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"

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
  let recipient = null
  if (group.payoutOrder === "SEQUENTIAL") {
    const idx = group.currentRecipientIndex % memberCount
    recipient = group.memberships[idx]?.user ?? null
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

  // Create a contribution for every member
  await prisma.contribution.createMany({
    data: group.memberships.map((m) => ({
      userId: m.userId,
      groupId,
      amount: group.contributionAmount,
      cycle: group.currentCycle,
      status: "PENDING",
      dueDate,
    })),
  })

  // For LOTTERY: pick a random recipient now and store as a pending payout
  if (group.payoutOrder === "LOTTERY") {
    const randomIdx = Math.floor(Math.random() * group.memberships.length)
    const recipientMembership = group.memberships[randomIdx]
    const recipientPhone = recipientMembership.user.phone || ""

    await prisma.payout.create({
      data: {
        groupId,
        recipientId: recipientMembership.userId,
        amount: group.contributionAmount * group.memberships.length,
        currency: "XAF",
        status: "SCHEDULED",
        provider: "FAPSHI",
        phoneNumber: recipientPhone,
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
