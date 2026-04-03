/**
 * Financial Analytics Service
 * Calculates statistics, metrics, and analytics data
 */

import { prisma } from "@/lib/db";
import {
  FinancialStats,
  ContributionRecord,
  GroupFinancialSummary,
  IndividualStatement,
  AnalyticsData,
  ChartData,
  DateRangeType,
} from "@/types/reports";

export class AnalyticsService {
  /**
   * Calculate financial statistics for a group
   */
  async calculateGroupStats(
    groupId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FinancialStats> {
    try {
      const where: any = {
        groupId,
      };

      if (startDate || endDate) {
        where.dueDate = {};
        if (startDate) where.dueDate.gte = startDate;
        if (endDate) where.dueDate.lte = endDate;
      }

      const contributions = await prisma.contribution.findMany({
        where,
      });

      if (contributions.length === 0) {
        return {
          totalContributions: 0,
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          averageContribution: 0,
          completionRate: 0,
        };
      }

      const now = new Date();
      const stats = contributions.reduce(
        (acc: any, contrib: any) => {
          acc.totalContributions++;
          acc.totalAmount += contrib.amount;

          if (contrib.status === "PAID") {
            acc.totalPaid++;
            acc.paidAmount += contrib.amount;
          } else if (contrib.status === "PENDING") {
            acc.totalPending++;
            acc.pendingAmount += contrib.amount;
          } else if (contrib.status === "OVERDUE") {
            acc.totalOverdue++;
            acc.overdueAmount += contrib.amount;
          }

          return acc;
        },
        {
          totalContributions: 0,
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
        }
      );

      return {
        ...stats,
        averageContribution:
          stats.totalAmount / Math.max(stats.totalContributions, 1),
        completionRate: (stats.totalPaid / stats.totalContributions) * 100,
      };
    } catch (error) {
      console.error("Error calculating group stats:", error);
      throw error;
    }
  }

  /**
   * Calculate statistics for a user
   */
  async calculateUserStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FinancialStats> {
    try {
      const where: any = {
        userId,
      };

      if (startDate || endDate) {
        where.dueDate = {};
        if (startDate) where.dueDate.gte = startDate;
        if (endDate) where.dueDate.lte = endDate;
      }

      const contributions = await prisma.contribution.findMany({
        where,
      });

      if (contributions.length === 0) {
        return {
          totalContributions: 0,
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
          averageContribution: 0,
          completionRate: 0,
        };
      }

      const stats = contributions.reduce(
        (acc: any, contrib: any) => {
          acc.totalContributions++;
          acc.totalAmount += contrib.amount;

          if (contrib.status === "PAID") {
            acc.totalPaid++;
            acc.paidAmount += contrib.amount;
          } else if (contrib.status === "PENDING") {
            acc.totalPending++;
            acc.pendingAmount += contrib.amount;
          } else if (contrib.status === "OVERDUE") {
            acc.totalOverdue++;
            acc.overdueAmount += contrib.amount;
          }

          return acc;
        },
        {
          totalContributions: 0,
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          overdueAmount: 0,
        }
      );

      return {
        ...stats,
        averageContribution:
          stats.totalAmount / Math.max(stats.totalContributions, 1),
        completionRate: (stats.totalPaid / stats.totalContributions) * 100,
      };
    } catch (error) {
      console.error("Error calculating user stats:", error);
      throw error;
    }
  }

  /**
   * Get group financial summary
   */
  async getGroupFinancialSummary(
    groupId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GroupFinancialSummary> {
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
          contributions: {
            include: {
              user: {
                select: { id: true, email: true, name: true, phone: true },
              },
            },
          },
          memberships: true,
        },
      });

      if (!group) {
        throw new Error(`Group ${groupId} not found`);
      }

      const stats = await this.calculateGroupStats(groupId, startDate, endDate);

      const contributions: ContributionRecord[] = group.contributions
        .filter((c: any) => {
          if (!startDate && !endDate) return true;
          if (startDate && c.dueDate < startDate) return false;
          if (endDate && c.dueDate > endDate) return false;
          return true;
        })
        .map((c: any) => ({
          id: c.id,
          userId: c.userId,
          userName: c.user.name ?? c.user.email,
          contributorPhone: c.user.phone,
          groupId: c.groupId,
          groupName: group.name,
          amount: c.amount,
          currency: "XAF",
          status: c.status as "PENDING" | "PAID" | "OVERDUE",
          dueDate: c.dueDate,
          paidAt: c.paidAt ?? undefined,
          daysOverdue:
            c.status === "OVERDUE"
              ? Math.floor(
                  (new Date().getTime() - c.dueDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : undefined,
          createdAt: c.createdAt,
        }));

      return {
        groupId: group.id,
        groupName: group.name,
        description: group.description ?? undefined,
        totalMembers: group.memberships.length,
        frequency: group.frequency,
        contributionAmount: group.contributionAmount,
        currency: "XAF",
        stats,
        contributions,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error getting group financial summary:", error);
      throw error;
    }
  }

  /**
   * Get individual contribution statement
   */
  async getIndividualStatement(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IndividualStatement> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: {
              group: true,
            },
          },
          contributions: {
            include: {
              group: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const totalStats = await this.calculateUserStats(
        userId,
        startDate,
        endDate
      );

      const groups = await Promise.all(
        user.memberships.map(async (membership: any) => {
          const stats = await this.calculateGroupStats(
            membership.groupId,
            startDate,
            endDate
          );

          const recentContributions = user.contributions
            .filter((c: any) => c.groupId === membership.groupId)
            .slice(0, 10)
            .map((c: any) => ({
              id: c.id,
              userId: c.userId,
              userName: user.name ?? user.email,
              contributorPhone: user.phone,
              groupId: c.groupId,
              groupName: membership.group.name,
              amount: c.amount,
              currency: "XAF",
              status: c.status as "PENDING" | "PAID" | "OVERDUE",
              dueDate: c.dueDate,
              paidAt: c.paidAt ?? undefined,
              createdAt: c.createdAt,
            }));

          return {
            groupId: membership.groupId,
            groupName: membership.group.name,
            role: membership.role,
            stats,
            recentContributions,
          } as any;
        })
      );

      return {
        userId: user.id,
        userName: user.name ?? user.email,
        email: user.email,
        phone: user.phone ?? undefined,
        groups,
        totalStats,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error("Error getting individual statement:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive analytics data
   */
  async getAnalyticsData(
    groupId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsData> {
    try {
      const where: any = {};
      if (groupId) where.groupId = groupId;
      if (startDate || endDate) {
        where.dueDate = {};
        if (startDate) where.dueDate.gte = startDate;
        if (endDate) where.dueDate.lte = endDate;
      }

      const contributions = await prisma.contribution.findMany({
        where,
        include: {
          group: true,
        },
      });

      // Calculate totals by status
      const byStatus = {
        paid: { count: 0, amount: 0 },
        pending: { count: 0, amount: 0 },
        overdue: { count: 0, amount: 0 },
      };

      contributions.forEach((c: any) => {
        if (c.status === "PAID") {
          byStatus.paid.count++;
          byStatus.paid.amount += c.amount;
        } else if (c.status === "PENDING") {
          byStatus.pending.count++;
          byStatus.pending.amount += c.amount;
        } else if (c.status === "OVERDUE") {
          byStatus.overdue.count++;
          byStatus.overdue.amount += c.amount;
        }
      });

      // Group by group
      const groupMap: Record<
        string,
        { name: string; amount: number; memberCount: number }
      > = {};

      contributions.forEach((c: any) => {
        if (!groupMap[c.groupId]) {
          groupMap[c.groupId] = {
            name: c.group.name,
            amount: 0,
            memberCount: 1,
          };
        }
        groupMap[c.groupId].amount += c.amount;
      });

      const byGroup = Object.entries(groupMap).map(([id, data]: any) => ({
        groupId: id,
        groupName: data.name,
        totalAmount: data.amount,
        memberCount: data.memberCount,
        completionRate: 0,
      }));

      // Calculate totals
      const totalAmount = byStatus.paid.amount + byStatus.pending.amount + byStatus.overdue.amount;

      return {
        period: {
          startDate: startDate || new Date(0),
          endDate: endDate || new Date(),
        },
        totals: {
          revenue: byStatus.paid.amount,
          expenses: 0,
          netProfit: byStatus.paid.amount,
          averageTransaction:
            totalAmount / Math.max(contributions.length, 1),
        },
        byStatus,
        byGroup,
        trends: [],
      };
    } catch (error) {
      console.error("Error getting analytics data:", error);
      throw error;
    }
  }

  /**
   * Get date range based on type
   */
  getDateRange(
    rangeType: DateRangeType
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (rangeType) {
      case DateRangeType.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case DateRangeType.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case DateRangeType.THIS_QUARTER:
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case DateRangeType.THIS_YEAR:
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case DateRangeType.LAST_30_DAYS:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case DateRangeType.LAST_90_DAYS:
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case DateRangeType.ALL_TIME:
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(0);
    }

    return { startDate, endDate };
  }
}

// Singleton instance
let analyticsInstance: AnalyticsService | null = null;

/**
 * Get or create analytics service instance
 */
export function getAnalyticsService(): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService();
  }
  return analyticsInstance;
}

export default AnalyticsService;
