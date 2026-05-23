import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

type AnalyticsRow = {
  month: string
  amount: number
  count: number
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        contributions: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            payment: {
              select: { status: true, createdAt: true, amount: true, provider: true },
            },
          },
        },
        payments: {
          select: {
            amount: true,
            status: true,
            provider: true,
            createdAt: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const members = group.memberships
    const contributions = group.contributions
    const payments = group.payments

    const totalContributed = contributions
      .filter((contribution) => contribution.status === "PAID")
      .reduce((sum, contribution) => sum + contribution.amount, 0)

    const pendingAmount = contributions
      .filter((contribution) => contribution.status !== "PAID")
      .reduce((sum, contribution) => sum + contribution.amount, 0)

    const totalPaidOut = payments
      .filter((payment) => payment.status === "COMPLETED")
      .reduce((sum, payment) => sum + payment.amount, 0)

    const activeMemberIds = new Set(
      contributions
        .filter((contribution) => contribution.status === "PAID")
        .map((contribution) => contribution.userId)
    )

    const overdueMemberIds = new Set(
      contributions
        .filter((contribution) => contribution.status === "OVERDUE")
        .map((contribution) => contribution.userId)
    )

    const contributionTrendMap = new Map<string, { amount: number; count: number }>()
    const now = new Date()
    const months: string[] = []

    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      const key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      months.push(key)
      contributionTrendMap.set(key, { amount: 0, count: 0 })
    }

    contributions.forEach((contribution) => {
      if (contribution.status !== "PAID") return
      const key = new Date(contribution.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      if (contributionTrendMap.has(key)) {
        const entry = contributionTrendMap.get(key)!
        entry.amount += contribution.amount
        entry.count += 1
      }
    })

    const paymentBreakdownMap = new Map<string, { count: number; amount: number }>()
    payments.forEach((payment) => {
      const key = payment.provider || "UNKNOWN"
      if (!paymentBreakdownMap.has(key)) {
        paymentBreakdownMap.set(key, { count: 0, amount: 0 })
      }
      const entry = paymentBreakdownMap.get(key)!
      entry.count += 1
      entry.amount += payment.amount
    })

    const contributorMap = new Map<string, { userId: string; userName: string; totalContributed: number; contributionCount: number }>()
    contributions
      .filter((contribution) => contribution.status === "PAID")
      .forEach((contribution) => {
        const member = contribution.user
        const userName = member.name || member.email
        if (!contributorMap.has(contribution.userId)) {
          contributorMap.set(contribution.userId, {
            userId: contribution.userId,
            userName,
            totalContributed: 0,
            contributionCount: 0,
          })
        }
        const entry = contributorMap.get(contribution.userId)!
        entry.totalContributed += contribution.amount
        entry.contributionCount += 1
      })

    const memberStats = members.map((membershipRow) => {
      const memberContributions = contributions.filter((contribution) => contribution.userId === membershipRow.userId)
      const totalForMember = memberContributions
        .filter((contribution) => contribution.status === "PAID")
        .reduce((sum, contribution) => sum + contribution.amount, 0)
      const paidCount = memberContributions.filter((contribution) => contribution.status === "PAID").length
      const lastContributionDate = memberContributions.length
        ? new Date(Math.max(...memberContributions.map((contribution) => new Date(contribution.createdAt).getTime())))
        : null

      let status: "active" | "inactive" | "defaulted" = "inactive"
      if (paidCount > 0) {
        status = overdueMemberIds.has(membershipRow.userId) ? "defaulted" : "active"
      } else if (overdueMemberIds.has(membershipRow.userId)) {
        status = "defaulted"
      }

      return {
        userId: membershipRow.userId,
        userName: membershipRow.user.name || membershipRow.user.email,
        email: membershipRow.user.email,
        totalContributed: totalForMember,
        participationRate: members.length ? Math.round((paidCount / Math.max(contributions.filter((c) => c.status === "PAID").length, 1)) * 100) : 0,
        lastContributionDate,
        status,
      }
    })

    const nextPendingContribution = contributions
      .filter((contribution) => contribution.status !== "PAID")
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]

    const cycleStartDate = contributions.length
      ? new Date(Math.min(...contributions.map((contribution) => contribution.createdAt.getTime())))
      : group.createdAt

    const cycleEndDate = payments.length
      ? new Date(Math.max(...payments.map((payment) => payment.createdAt.getTime())))
      : null

    return NextResponse.json(
      {
        data: {
          groupId: group.id,
          groupName: group.name,
          totalMembers: members.length,
          activeMembers: activeMemberIds.size,
          totalContributed,
          totalPaidOut,
          pendingAmount,
          defaultRate: members.length ? Math.round((overdueMemberIds.size / members.length) * 100) : 0,
          participationRate: members.length ? Math.round((activeMemberIds.size / members.length) * 100) : 0,
          contributionTrend: months.map((month) => ({ month, ...contributionTrendMap.get(month)! })) as AnalyticsRow[],
          paymentBreakdown: Array.from(paymentBreakdownMap.entries()).map(([method, entry]) => ({
            method,
            count: entry.count,
            amount: entry.amount,
          })),
          topContributors: Array.from(contributorMap.values()).sort((a, b) => b.totalContributed - a.totalContributed),
          memberStats,
          nextPayoutDate: nextPendingContribution?.dueDate ?? null,
          nextPayoutAmount: nextPendingContribution?.amount ?? null,
          cycleStartDate,
          cycleEndDate,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Group analytics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}