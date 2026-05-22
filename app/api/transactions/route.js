
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch contributions for the user
    const contributions = await prisma.contribution.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        group: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch payments for the user
    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        group: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch payouts where user is recipient
    const payouts = await prisma.payout.findMany({
      where: {
        recipientId: session.user.id,
      },
      include: {
        group: true,
        recipient: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data into unified transaction format
    const transactions = [
      ...contributions.map((c) => ({
        id: c.id,
        type: 'contribution',
        amount: c.amount,
        status: c.status,
        createdAt: c.createdAt,
        group: c.group,
        reference: `CONT-${c.id.substring(0, 6).toUpperCase()}`,
      })),
      ...payments.map((p) => ({
        id: p.id,
        type: 'payment',
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
        group: p.group,
        reference: p.providerRef || `PAY-${p.id.substring(0, 6).toUpperCase()}`,
      })),
      ...payouts.map((po) => ({
        id: po.id,
        type: 'payout',
        amount: po.amount,
        status: po.status,
        createdAt: po.createdAt,
        group: po.group,
        reference: po.providerRef || `PAYOUT-${po.id.substring(0, 6).toUpperCase()}`,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
