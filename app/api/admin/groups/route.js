import { NextResponse } from 'next/server';
import { checkUserRole, roleErrorResponse } from '@/lib/role-middleware';
import prisma from '@/lib/db';

/**
 * GET /api/admin/groups
 * Admin+ only - Get all groups (Super Admin sees all, Admin sees their groups)
 */
export async function GET(request) {
  const roleCheck = await checkUserRole('ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    let groups;

    if (roleCheck.user.role === 'SUPER_ADMIN') {
      // Super admin sees all groups
      groups = await prisma.group.findMany({
        include: {
          memberships: {
            select: {
              userId: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Admin sees only groups they're admin of
      groups = await prisma.group.findMany({
        where: {
          memberships: {
            some: {
              userId: roleCheck.user.id,
              role: 'ADMIN',
            },
          },
        },
        include: {
          memberships: {
            select: {
              userId: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}

/**
 * POST /api/admin/groups/[groupId]/status
 * Admin+ only - Update group status
 */
export async function POST(request, { params }) {
  const roleCheck = await checkUserRole('ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const { status } = await request.json();

    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return roleErrorResponse('Invalid status', 400);
    }

    // Check if user is admin of this group
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: roleCheck.user.id,
          groupId: params.groupId,
        },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      if (roleCheck.user.role !== 'SUPER_ADMIN') {
        return roleErrorResponse('Not authorized to manage this group', 403);
      }
    }

    const updatedGroup = await prisma.group.update({
      where: { id: params.groupId },
      data: { status },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group status:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}
