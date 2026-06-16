import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkGroupRole, roleErrorResponse } from '@/lib/role-middleware';
import prisma from '@/lib/db';

/**
 * POST /api/disputes/[disputeId]/vote
 * MEMBER - Vote on a dispute
 */
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const { vote } = await request.json(); // "UPHOLD" or "REJECT"

    if (!['UPHOLD', 'REJECT'].includes(vote)) {
      return NextResponse.json({ success: false, error: { message: 'Invalid vote' } }, { status: 400 });
    }

    const resolvedParams = params && typeof params.then === 'function' ? await params : params;
    const disputeId = resolvedParams.id;

    // Get dispute and check if user is member of group
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { group: { include: { _count: { select: { memberships: true } } } } },
    });

    if (!dispute) {
      return NextResponse.json({ success: false, error: { message: 'Dispute not found' } }, { status: 404 });
    }

    // Check if user is member of the group
    const roleCheck = await checkGroupRole(dispute.groupId, 'MEMBER');

    if (!roleCheck.authorized) {
      return roleErrorResponse(roleCheck.error, 403);
    }

    if (dispute.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: { message: 'This dispute is no longer open for voting' } },
        { status: 400 }
      );
    }

    // Record vote
    await prisma.disputeVote.create({
      data: {
        disputeId,
        vote,
      },
    });

    const votes = await prisma.disputeVote.findMany({
      where: { disputeId },
      select: { vote: true },
    });

    const uphold = votes.filter((v) => v.vote === 'UPHOLD').length;
    const reject = votes.filter((v) => v.vote === 'REJECT').length;
    const total = uphold + reject;
    const totalMembers = dispute.group._count.memberships;

    return NextResponse.json(
      {
        success: true,
        data: {
          votes: {
            uphold,
            reject,
            total,
            totalMembers,
            participated: totalMembers ? Math.round((total / totalMembers) * 100) : 0,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}
