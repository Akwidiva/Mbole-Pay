import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string(),
});

type GroupMetrics = {
  groupId: string;
  groupName: string;
  totalMembers: number;
  activeMembers: number;
  totalContributed: number;
  totalPaidOut: number;
  pendingAmount: number;
  defaultRate: number;
  participationRate: number;
  contributionTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  paymentBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  topContributors: Array<{
    userId: string;
    userName: string;
    totalContributed: number;
    contributionCount: number;
  }>;
  memberStats: Array<{
    userId: string;
    userName: string;
    email: string;
    totalContributed: number;
    participationRate: number;
    lastContributionDate: Date | null;
    status: "active" | "inactive" | "defaulted";
  }>;
  nextPayoutDate: Date | null;
  nextPayoutAmount: number | null;
  cycleStartDate: Date | null;
  cycleEndDate: Date | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate params
    const { id: groupId } = paramsSchema.parse(params);

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "User not found" } },
        { status: 404 }
      );
    }

    // Check if user is member of group
    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { message: "Not a member of this group" } },
        { status: 403 }
      );
    }

    // Get group details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: { message: "Group not found" } },
        { status: 404 }
      );
    }

    // Get all contributions for this group
    const contributions = await prisma.contribution.findMany({
      where: { groupId },
      include: { user: true },
    });

    // Get all payments for this group
    const payments = await prisma.payment.findMany({
      where: { groupId },
      include: { user: true },
    });

    // Get all payouts for this group
    const payouts = await prisma.payout.findMany({
      where: { groupId },
    });

    // Calculate metrics
    const totalMembers = group.members.length;
    const activeMembers = group.members.filter((m) => m.status === "active")
      .length;

    // Total contributed (sum of all contributions)
    const totalContributed = contributions.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    // Total paid out (sum of completed payouts)
    const totalPaidOut = payouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0);

    // Pending amount (scheduled payouts not yet completed)
    const pendingAmount = payouts
      .filter((p) => p.status === "scheduled")
      .reduce((sum, p) => sum + p.amount, 0);

    // Default rate (members who haven't paid in 30 days or have unpaid amounts)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const defaultedMembers = group.members.filter((member) => {
      const lastContribution = contributions
        .filter((c) => c.userId === member.userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      return (
        !lastContribution || lastContribution.createdAt < thirtyDaysAgo
      );
    });

    const defaultRate =
      totalMembers > 0
        ? Math.round((defaultedMembers.length / totalMembers) * 100)
        : 0;

    // Participation rate (members who have contributed)
    const participatingMembers = new Set(
      contributions.map((c) => c.userId)
    ).size;
    const participationRate =
      totalMembers > 0
        ? Math.round((participatingMembers / totalMembers) * 100)
        : 0;

    // Contribution trend (last 12 months)
    const contributionTrend = getContributionTrend(contributions);

    // Payment breakdown (by method)
    const paymentBreakdown = getPaymentBreakdown(payments);

    // Top contributors
    const topContributors = getTopContributors(contributions);

    // Member stats
    const memberStats = getMemberStats(
      group.members,
      contributions,
      thirtyDaysAgo
    );

    // Next payout info
    const nextPayout = payouts
      .filter((p) => p.status === "scheduled")
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())[0];

    // Determine cycle dates based on group settings
    const cycleStartDate = group.contributionStartDate || new Date();
    const cycleEndDate = group.contributionEndDate || null;

    const metrics: GroupMetrics = {
      groupId,
      groupName: group.name,
      totalMembers,
      activeMembers,
      totalContributed,
      totalPaidOut,
      pendingAmount,
      defaultRate,
      participationRate,
      contributionTrend,
      paymentBreakdown,
      topContributors,
      memberStats,
      nextPayoutDate: nextPayout?.scheduledDate || null,
      nextPayoutAmount: nextPayout?.amount || null,
      cycleStartDate,
      cycleEndDate,
    };

    return NextResponse.json(
      {
        success: true,
        data: metrics,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Server error",
        },
      },
      { status: 500 }
    );
  }
}

function getContributionTrend(
  contributions: Array<any>
): Array<{ month: string; amount: number; count: number }> {
  const monthlyData: Record<
    string,
    { amount: number; count: number }
  > = {};

  // Last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
    monthlyData[monthKey] = { amount: 0, count: 0 };
  }

  // Aggregate contributions by month
  contributions.forEach((contribution) => {
    const monthKey = contribution.createdAt.toISOString().slice(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].amount += contribution.amount;
      monthlyData[monthKey].count += 1;
    }
  });

  // Convert to array
  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    amount: data.amount,
    count: data.count,
  }));
}

function getPaymentBreakdown(
  payments: Array<any>
): Array<{ method: string; count: number; amount: number }> {
  const breakdown: Record<string, { count: number; amount: number }> = {};

  payments.forEach((payment) => {
    const method = payment.method || "unknown";
    if (!breakdown[method]) {
      breakdown[method] = { count: 0, amount: 0 };
    }
    breakdown[method].count += 1;
    breakdown[method].amount += payment.amount;
  });

  return Object.entries(breakdown).map(([method, data]) => ({
    method,
    count: data.count,
    amount: data.amount,
  }));
}

function getTopContributors(
  contributions: Array<any>
): Array<{
  userId: string;
  userName: string;
  totalContributed: number;
  contributionCount: number;
}> {
  const contributorMap: Record<
    string,
    { userId: string; userName: string; totalContributed: number; count: number }
  > = {};

  contributions.forEach((contribution) => {
    const key = contribution.userId;
    if (!contributorMap[key]) {
      contributorMap[key] = {
        userId: contribution.userId,
        userName: contribution.user?.name || "Unknown",
        totalContributed: 0,
        count: 0,
      };
    }
    contributorMap[key].totalContributed += contribution.amount;
    contributorMap[key].count += 1;
  });

  return Object.values(contributorMap)
    .sort((a, b) => b.totalContributed - a.totalContributed)
    .slice(0, 10)
    .map((c) => ({
      userId: c.userId,
      userName: c.userName,
      totalContributed: c.totalContributed,
      contributionCount: c.count,
    }));
}

function getMemberStats(
  members: Array<any>,
  contributions: Array<any>,
  thirtyDaysAgo: Date
): Array<{
  userId: string;
  userName: string;
  email: string;
  totalContributed: number;
  participationRate: number;
  lastContributionDate: Date | null;
  status: "active" | "inactive" | "defaulted";
}> {
  return members.map((member) => {
    const memberContributions = contributions.filter(
      (c) => c.userId === member.userId
    );
    const totalContributed = memberContributions.reduce(
      (sum, c) => sum + c.amount,
      0
    );
    const lastContributionDate = memberContributions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .at(0)?.createdAt || null;

    // Determine status
    let status: "active" | "inactive" | "defaulted" = "inactive";
    if (member.status === "active" && lastContributionDate) {
      if (lastContributionDate > thirtyDaysAgo) {
        status = "active";
      } else {
        status = "defaulted";
      }
    }

    return {
      userId: member.userId,
      userName: member.user?.name || "Unknown",
      email: member.user?.email || "unknown@example.com",
      totalContributed,
      participationRate: memberContributions.length > 0 ? 100 : 0,
      lastContributionDate,
      status,
    };
  });
}
