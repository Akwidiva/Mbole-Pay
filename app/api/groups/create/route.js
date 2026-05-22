import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';

/**
 * POST /api/groups
 * USER - Create a new group
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

    const { name, description, contributionAmount, frequency, cycleType } = await request.json();

    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15).toUpperCase();

    const group = await prisma.group.create({
      data: {
        name,
        description,
        contributionAmount,
        frequency,
        cycleType,
        inviteCode,
        creator_id: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: 'ADMIN', // Creator is group admin
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
