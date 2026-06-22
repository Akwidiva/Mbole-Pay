import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';

const QUORUM_PERCENT = 60;

/**
 * POST /api/disputes/[id]/vote
 * Any group member may vote UPHOLD or REJECT once within the 72h window.
 * Auto-resolves when 60% quorum is reached.
 */
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
  }

  try {
    const { vote } = await request.json();
    if (!['UPHOLD', 'REJECT'].includes(vote)) {
      return NextResponse.json({ success: false, error: { message: 'Vote must be UPHOLD or REJECT' } }, { status: 400 });
    }

    const resolvedParams = params && typeof params.then === 'function' ? await params : params;
    const disputeId = resolvedParams.id;

    const voter = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!voter) return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 });

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { group: { include: { _count: { select: { memberships: true } } } } },
    });
    if (!dispute) return NextResponse.json({ success: false, error: { message: 'Dispute not found' } }, { status: 404 });

    // Must be a group member
    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: voter.id, groupId: dispute.groupId } },
    });
    if (!membership) return NextResponse.json({ success: false, error: { message: 'Not a member of this group' } }, { status: 403 });

    if (dispute.status !== 'OPEN') {
      return NextResponse.json({ success: false, error: { message: 'This dispute is no longer open for voting' } }, { status: 400 });
    }

    // FR-09: enforce 72h voting window
    if (new Date() > dispute.votingDeadline) {
      await prisma.dispute.update({ where: { id: disputeId }, data: { status: 'EXPIRED' } });
      return NextResponse.json({ success: false, error: { message: 'Voting window has closed (72h passed)' } }, { status: 400 });
    }

    // FR-09: one vote per member per dispute
    const existing = await prisma.disputeVote.findUnique({
      where: { disputeId_voterId: { disputeId, voterId: voter.id } },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: { message: 'You have already voted on this dispute' } }, { status: 409 });
    }

    await prisma.disputeVote.create({ data: { disputeId, vote, voterId: voter.id } });

    const votes = await prisma.disputeVote.findMany({ where: { disputeId }, select: { vote: true } });
    const uphold = votes.filter((v) => v.vote === 'UPHOLD').length;
    const reject = votes.filter((v) => v.vote === 'REJECT').length;
    const total = uphold + reject;
    const totalMembers = dispute.group._count.memberships;
    const participationPct = totalMembers ? (total / totalMembers) * 100 : 0;

    // FR-09: auto-resolve when 60% quorum reached with a clear majority
    let resolved = false;
    if (participationPct >= QUORUM_PERCENT) {
      const resolution = uphold > reject ? 'UPHELD' : 'REJECTED';
      await prisma.dispute.update({
        where: { id: disputeId },
        data: { status: 'RESOLVED', resolution },
      });
      resolved = true;

      // Record outcome on-chain (non-blocking)
      try {
        const { recordDisputeOnChain } = await import('@/lib/blockchain/factory');
        recordDisputeOnChain({
          dbGroupId: dispute.groupId,
          disputeId,
          resolution,
          upholdVotes: uphold,
          rejectVotes: reject,
          totalMembers,
        }).catch((err) => console.warn('[blockchain] dispute record failed (non-fatal):', err.message));
      } catch {
        // blockchain module may not have this function yet — non-fatal
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        resolved,
        resolution: resolved ? (uphold > reject ? 'UPHELD' : 'REJECTED') : null,
        votes: { uphold, reject, total, totalMembers, participationPct: Math.round(participationPct) },
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}
