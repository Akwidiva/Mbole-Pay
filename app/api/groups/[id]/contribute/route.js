import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkGroupRole, roleErrorResponse } from '@/lib/role-middleware';
import prisma from '@/lib/db';

/**
 * POST /api/groups/[groupId]/contribute
 * MEMBER - Make a contribution to a group
 */
export async function POST(request, { params }) {
  // Check if user is a member of this group
  const roleCheck = await checkGroupRole(params.groupId, 'MEMBER');

  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403);
  }

  try {
    const { amount, dueDate } = await request.json();

    // Create contribution
    const contribution = await prisma.contribution.create({
      data: {
        userId: roleCheck.user.id,
        groupId: params.groupId,
        amount,
        dueDate: new Date(dueDate),
        status: 'PENDING',
      },
      include: {
        group: true,
        user: true,
      },
    });

    return NextResponse.json(contribution, { status: 201 });
  } catch (error) {
    console.error('Error creating contribution:', error);
    return roleErrorResponse('Internal Server Error', 500);
  }
}
