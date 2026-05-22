import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';

/**
 * GET /api/payouts
 * MEMBER - Get user's payouts
 */
export async function GET(request) {
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

    // Get payouts for this user
    const payouts = await prisma.payout.findMany({
      where: {
        recipientId: user.id,
      },
      include: {
        group: true,
        recipient: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary
    const summary = {
      totalPayouts: payouts.reduce((sum, p) => sum + p.amount, 0),
      completedPayouts: payouts
        .filter((p) => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0),
      pendingPayouts: payouts
        .filter((p) => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0),
    };

    return NextResponse.json({
      summary,
      payouts,
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
