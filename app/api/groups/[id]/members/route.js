import { NextResponse } from 'next/server';
import { checkGroupRole, roleErrorResponse } from '@/lib/role-middleware';
import prisma from '@/lib/db';

/**
 * GET /api/groups/[groupId]/members
 * ADMIN - Get all members in a group
 */
export async function GET(request, { params }) {
  const groupId = params.groupId || params.id;
  const roleCheck = await checkGroupRole(groupId, 'ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const members = await prisma.membership.findMany({
      where: {
        groupId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}

/**
 * PUT /api/groups/[groupId]/members/[memberId]/role
 * ADMIN - Assign role to a group member
 */
export async function PUT(request, { params }) {
  const groupId = params.groupId || params.id;
  const roleCheck = await checkGroupRole(groupId, 'ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const role = body.role || body.newRole
    const userId = params.memberId || body.userId

    const validRoles = ['ADMIN', 'TREASURER', 'MEMBER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
    }

    const updatedMembership = await prisma.membership.update({
      where: {
        userId_groupId: {
          userId: userId,
          groupId,
        },
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(updatedMembership);
  } catch (error) {
    console.error('Error updating member role:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}

/**
 * DELETE /api/groups/[groupId]/members/[memberId]
 * ADMIN - Remove a member from a group
 */
export async function DELETE(request, { params }) {
  const groupId = params.groupId || params.id;
  const roleCheck = await checkGroupRole(groupId, 'ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const userId = params.memberId || body.userId

    if (!userId) {
      return NextResponse.json({ error: 'Member id is required' }, { status: 400 });
    }

    const membership = await prisma.membership.delete({
      where: {
        userId_groupId: {
          userId: userId,
          groupId,
        },
      },
    });

    return NextResponse.json({
      message: 'Member removed from group',
      membership,
    });
  } catch (error) {
    console.error('Error removing member:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}
