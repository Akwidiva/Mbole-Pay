import { NextResponse } from 'next/server';
import { checkUserRole, roleErrorResponse } from '@/lib/role-middleware';
import prisma from '@/lib/db';

/**
 * GET /api/admin/users
 * Super Admin only - Get all users in the system
 */
export async function GET() {
  const roleCheck = await checkUserRole('SUPER_ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        memberships: {
          select: {
            groupId: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}

/**
 * PUT /api/admin/users/[userId]/role
 * Super Admin only - Update user role
 */
export async function PUT(request, { params }) {
  const roleCheck = await checkUserRole('SUPER_ADMIN');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const { role } = await request.json();

    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'USER'];
    if (!validRoles.includes(role)) {
      return roleErrorResponse('Invalid role', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}
