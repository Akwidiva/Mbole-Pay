import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from '@/lib/db'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate total contributions across all groups
    const contributions = await prisma.contribution.findMany({
      where: {
        userId: user.id,
      },
    });

    const totalContributions = contributions.reduce(
      (sum, contrib) => sum + (contrib.amount || 0),
      0
    );

    // Calculate total pending payout (payouts that haven't been marked as paid)
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        recipientId: user.id,
        status: "PENDING", // Only count pending payouts
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    const pendingPayout = pendingPayouts.reduce(
      (sum, payout) => sum + (payout.amount || 0),
      0
    );

    // Get next payout date from pending payouts
    const nextPayout = pendingPayouts.length > 0 ? pendingPayouts[0] : null;
    const nextPayoutDate = nextPayout?.payoutDate;

    // Count total members user is in groups with
    const memberCount = user.memberships.length;

    return new Response(
      JSON.stringify({
        data: {
          totalContributions,
          pendingPayout,
          nextPayoutDate,
          memberCount,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
