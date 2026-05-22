import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';

/**
 * POST /api/groups/join
 * USER - Join a group using invite code
 */
export async function POST(request) {
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

    const { inviteCode } = await request.json();

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode },
    });

    if (!group) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: group.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 });
    }

    // Add user as member
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        groupId: group.id,
        role: 'MEMBER',
      },
    });

    return NextResponse.json({ group, membership }, { status: 201 });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
