import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { userHasPermission } from "@/lib/rbac"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            group: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's contributions
    const contributions = await prisma.contribution.findMany({
      where: { userId: user.id },
      include: { group: true },
    })

    const totalContributions = contributions.reduce((sum, c) => sum + (c.status === "PAID" ? c.amount : 0), 0)
    const pendingContributions = contributions.filter((c) => c.status === "PENDING")
    const pendingTotal = pendingContributions.reduce((sum, c) => sum + c.amount, 0)

    // Get user's payouts
    const payouts = await prisma.payout.findMany({
      where: { recipient_id: user.id },
      include: { group: true },
    })

    const totalPayouts = payouts.reduce((sum, p) => sum + (p.status === "COMPLETED" ? p.amount : 0), 0)

    // Get groups user is member of
    const groups = user.memberships.map((m) => m.group)

    const summary = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      stats: {
        totalGroups: groups.length,
        totalContributed: totalContributions,
        pendingContributions: pendingTotal,
        totalPayoutsReceived: totalPayouts,
      },
      recentContributions: contributions.slice(-5).reverse(),
      recentPayouts: payouts.slice(-5).reverse(),
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        inviteCode: g.inviteCode,
        frequency: g.frequency,
        status: g.status,
      })),
    }

    return NextResponse.json(summary, { status: 200 })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
