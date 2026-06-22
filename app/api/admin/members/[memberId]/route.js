import { NextResponse } from 'next/server';
import { checkUserRole, roleErrorResponse } from '@/lib/role-middleware';
import prisma from '@/lib/db';

/**
 * POST /api/admin/members/[memberId]/approve
 * ADMIN - Approve a member to join a group
 */
export async function POST(request, { params }) {
  const roleCheck = await checkUserRole('ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const { groupId } = await request.json();

    // Find existing membership (pending)
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: params.memberId,
          groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Update membership status (if you add a status field)
    // For now, just return approved
    return NextResponse.json({
      ...membership,
      status: 'APPROVED',
    });
  } catch (error) {
    console.error('Error approving member:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}

/**
 * POST /api/admin/members/[memberId]/reject
 * ADMIN - Reject a member from joining a group
 */
export async function DELETE(request, { params }) {
  const roleCheck = await checkUserRole('ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const { groupId } = await request.json();

    // Remove membership
    const membership = await prisma.membership.deleteUnique({
      where: {
        userId_groupId: {
          userId: params.memberId,
          groupId,
        },
      },
    });

    return NextResponse.json({
      message: 'Member rejected',
      membership,
    });
  } catch (error) {
    console.error('Error rejecting member:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}
