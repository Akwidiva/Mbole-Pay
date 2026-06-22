import { NextResponse } from 'next/server';
import { checkGroupRole, roleErrorResponse } from '@/lib/role-middleware';
import prisma from '@/lib/db';

/**
 * GET /api/groups/[groupId]/reports
 * ADMIN only - View group reports
 */
export async function GET(request, { params }) {
  const roleCheck = await checkGroupRole(params.groupId, 'ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    // Get group data
    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        contributions: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        payments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        payouts: {
          include: {
            recipient: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Calculate totals
    const totalContributions = group.contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalPayments = group.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPayouts = group.payouts.reduce((sum, p) => sum + p.amount, 0);
    const memberCount = await prisma.membership.count({
      where: { groupId: params.groupId },
    });

    const report = {
      group: {
        id: group.id,
        name: group.name,
        status: group.status,
        frequency: group.frequency,
        cycleType: group.cycleType,
      },
      summary: {
        totalMembers: memberCount,
        totalContributions,
        totalPayments,
        totalPayouts,
        balance: totalContributions - totalPayouts,
      },
      contributions: group.contributions,
      payments: group.payments,
      payouts: group.payouts,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching group report:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}
