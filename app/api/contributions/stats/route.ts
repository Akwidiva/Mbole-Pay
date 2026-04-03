// app/api/contributions/stats/route.ts
import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { userHasPermission } from "@/lib/rbac"

/**
 * GET /api/contributions/stats
 * Get contribution statistics for user/group
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get query parameters
    const url = new URL(req.url)
    const groupId = url.searchParams.get("groupId")

    // Check permission to view stats
    if (groupId) {
      const hasPermission = await userHasPermission(user.id, groupId, "contributions:view")
      if (!hasPermission) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to view statistics for this group" },
          { status: 403 }
        )
      }
    }

    // Build filter
    const where: any = { userId: user.id }
    if (groupId) where.groupId = groupId

    // Get all contributions for user (filtered by group if provided)
    const contributions = await prisma.contribution.findMany({
      where,
    })

    // Calculate statistics
    const stats = {
      totalAmount: contributions.reduce((sum, c) => sum + c.amount, 0),
      paidAmount: contributions
        .filter((c) => c.status === "PAID")
        .reduce((sum, c) => sum + c.amount, 0),
      pendingAmount: contributions
        .filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + c.amount, 0),
      overdueAmount: contributions
        .filter((c) => c.status === "OVERDUE")
        .reduce((sum, c) => sum + c.amount, 0),
      totalCount: contributions.length,
      paidCount: contributions.filter((c) => c.status === "PAID").length,
      pendingCount: contributions.filter((c) => c.status === "PENDING").length,
      overdueCount: contributions.filter((c) => c.status === "OVERDUE").length,
      completionRate:
        contributions.length > 0
          ? Math.round(
              (contributions.filter((c) => c.status === "PAID").length /
                contributions.length) *
                100
            )
          : 0,
    }

    // Get group-level stats if groupId provided
    let groupStats = null
    if (groupId) {
      const groupContributions = await prisma.contribution.findMany({
        where: { groupId },
      })

      groupStats = {
        totalAmount: groupContributions.reduce((sum, c) => sum + c.amount, 0),
        paidAmount: groupContributions
          .filter((c) => c.status === "PAID")
          .reduce((sum, c) => sum + c.amount, 0),
        pendingAmount: groupContributions
          .filter((c) => c.status === "PENDING")
          .reduce((sum, c) => sum + c.amount, 0),
        overdueAmount: groupContributions
          .filter((c) => c.status === "OVERDUE")
          .reduce((sum, c) => sum + c.amount, 0),
        totalCount: groupContributions.length,
        paidCount: groupContributions.filter((c) => c.status === "PAID")
          .length,
        pendingCount: groupContributions.filter((c) => c.status === "PENDING")
          .length,
        overdueCount: groupContributions.filter((c) => c.status === "OVERDUE")
          .length,
        memberCount: await prisma.membership.count({
          where: { groupId },
        }),
      }
    }

    return NextResponse.json(
      {
        userStats: stats,
        groupStats,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Get stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}
