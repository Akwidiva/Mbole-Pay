import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { payoutOrderedMemberships } from "@/lib/services/payout-service"

// GET /api/user/recipient-groups
// Returns all active groups where the current user is the recipient for the current cycle.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ data: [] })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ data: [] })

  // All groups the user is a member of
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  })

  const groupIds = memberships.map((m) => m.groupId)
  if (groupIds.length === 0) return NextResponse.json({ data: [] })

  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds }, status: "ACTIVE" },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  const recipientGroups = []

  for (const group of groups) {
    const memberCount = group.memberships.length
    const ordered = payoutOrderedMemberships(group.memberships)

    let recipientId: string | null = null

    if (group.payoutOrder === "SEQUENTIAL") {
      const idx = group.currentRecipientIndex % memberCount
      recipientId = ordered[idx]?.userId ?? null
    } else {
      const payout = await prisma.payout.findFirst({
        where: { groupId: group.id, cycle: group.currentCycle },
      })
      recipientId = payout?.recipientId ?? null
    }

    if (recipientId !== user.id) continue

    // Check cycle is active (contributions exist)
    const myContribution = await prisma.contribution.findFirst({
      where: { groupId: group.id, cycle: group.currentCycle, userId: user.id },
    })

    const paidCount = await prisma.contribution.count({
      where: { groupId: group.id, cycle: group.currentCycle, status: "PAID" },
    })
    const totalCount = await prisma.contribution.count({
      where: { groupId: group.id, cycle: group.currentCycle },
    })

    recipientGroups.push({
      groupId: group.id,
      groupName: group.name,
      cycle: group.currentCycle,
      // Excludes the recipient's own offset contribution — only real money collected from others.
      totalPool: group.contributionAmount * (memberCount - 1),
      cycleStarted: !!myContribution,
      paidCount,
      totalCount,
      payoutReady: totalCount > 0 && paidCount === totalCount,
    })
  }

  return NextResponse.json({ data: recipientGroups })
}
