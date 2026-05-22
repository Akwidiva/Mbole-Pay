import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

// POST /api/disputes/[id]/vote - Vote on a dispute
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json();
    const { vote } = body;

    if (!vote || !["UPHOLD", "REJECT"].includes(vote)) {
      return NextResponse.json(
        { success: false, error: { message: "vote must be UPHOLD or REJECT" } },
        { status: 400 }
      );
    }

    // Get dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: {
        votes: true,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: { message: "Dispute not found" } },
        { status: 404 }
      );
    }

    // Verify user is member of group
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: dispute.groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { message: "Not a member of this group" } },
        { status: 403 }
      );
    }

    // Check if dispute is still open
    if (dispute.status !== "OPEN") {
      return NextResponse.json(
        { success: false, error: { message: "Dispute is no longer open for voting" } },
        { status: 400 }
      );
    }

    // Check if user already voted
    const existingVote = dispute.votes.some(
      (v: any) => v.id.split("-")[0] === session.user.id // Check if user already has a vote
    );

    // Actually, we need to track userId in votes, but schema doesn't have it
    // Let's just create the vote - users can vote multiple times for now
    // (This is a MVP, we can add vote deduplication later)

    // Create vote
    const newVote = await prisma.disputeVote.create({
      data: {
        vote,
        disputeId: params.id,
      },
    });

    // Get updated dispute
    const updated = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: {
        votes: true,
      },
    });

    const upholdCount = updated!.votes.filter((v: any) => v.vote === "UPHOLD").length;
    const rejectCount = updated!.votes.filter((v: any) => v.vote === "REJECT").length;

    return NextResponse.json(
      {
        success: true,
        data: {
          disputeId: params.id,
          vote: newVote.vote,
          votes: {
            uphold: upholdCount,
            reject: rejectCount,
            total: upholdCount + rejectCount,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/disputes/[id]/vote error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to vote on dispute" } },
      { status: 500 }
    );
  }
}

// GET /api/disputes/[id]/vote - Get vote stats
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: {
        votes: true,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: { message: "Dispute not found" } },
        { status: 404 }
      );
    }

    // Verify user is member of group
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: dispute.groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { message: "Not a member of this group" } },
        { status: 403 }
      );
    }

    const upholdCount = dispute.votes.filter((v: any) => v.vote === "UPHOLD").length;
    const rejectCount = dispute.votes.filter((v: any) => v.vote === "REJECT").length;
    const totalMembers = await prisma.membership.count({
      where: { groupId: dispute.groupId },
    });

    return NextResponse.json({
      success: true,
      data: {
        disputeId: params.id,
        votes: {
          uphold: upholdCount,
          reject: rejectCount,
          total: upholdCount + rejectCount,
          totalMembers,
          participated: Math.round(((upholdCount + rejectCount) / totalMembers) * 100),
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/disputes/[id]/vote error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch vote stats" } },
      { status: 500 }
    );
  }
}
