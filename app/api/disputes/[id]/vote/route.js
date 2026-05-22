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

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { vote } = await request.json(); // "UPHOLD" or "REJECT"

    if (!['UPHOLD', 'REJECT'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    // Get dispute and check if user is member of group
    const dispute = await prisma.dispute.findUnique({
      where: { id: params.disputeId },
      include: { group: true },
    });

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    // Check if user is member of the group
    const roleCheck = await checkGroupRole(dispute.groupId, 'MEMBER');

    if (!roleCheck.authorized) {
      return roleErrorResponse(roleCheck.error, 403);
    }

    // Check if user already voted
    const existingVote = await prisma.disputeVote.findFirst({
      where: {
        disputeId: params.disputeId,
        AND: [
          {
            dispute: {
              groupId: dispute.groupId,
            },
          },
        ],
      },
    });

    // Create vote
    const disputeVote = await prisma.disputeVote.create({
      data: {
        disputeId: params.disputeId,
        vote,
      },
    });

    return NextResponse.json(disputeVote, { status: 201 });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
