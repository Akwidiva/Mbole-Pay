import { NextResponse } from 'next/server';
import { checkUserRole, roleErrorResponse } from '@/lib/role-middleware';
import prisma from '@/lib/db';

/**
 * POST /api/admin/disputes/[disputeId]/resolve
 * SUPER_ADMIN - Resolve a dispute
 */
export async function POST(request, { params }) {
  const roleCheck = await checkUserRole('SUPER_ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const { resolution, status } = await request.json(); // resolution: "UPHELD" or "REJECTED", status: "RESOLVED"

    if (!['OPEN', 'RESOLVED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update dispute status
    const updatedDispute = await prisma.dispute.update({
      where: { id: params.disputeId },
      data: {
        status,
      },
      include: {
        votes: true,
        group: true,
      },
    });

    return NextResponse.json({
      ...updatedDispute,
      resolution,
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}
