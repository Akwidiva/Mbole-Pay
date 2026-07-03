import { NextResponse } from 'next/server';
import { checkUserRole, roleErrorResponse } from '@/lib/role-middleware';
import prisma from '@/lib/db';

/**
 * POST /api/admin/disputes/[disputeId]/resolve
 * ADMIN - Manually resolve a dispute
 * body: { resolution: "UPHELD" | "REJECTED" }
 */
export async function POST(request, { params }) {
  const roleCheck = await checkUserRole('ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const { resolution } = await request.json();

    if (!['UPHELD', 'REJECTED'].includes(resolution)) {
      return NextResponse.json({ error: 'Resolution must be UPHELD or REJECTED' }, { status: 400 });
    }

    const dispute = await prisma.dispute.findUnique({ where: { id: params.disputeId } });
    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }
    if (dispute.status !== 'OPEN') {
      return NextResponse.json({ error: 'Only OPEN disputes can be resolved' }, { status: 400 });
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: params.disputeId },
      data: {
        status: 'RESOLVED',
        resolution,
      },
      include: {
        votes: true,
        group: true,
      },
    });

    return NextResponse.json(updatedDispute);
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}
