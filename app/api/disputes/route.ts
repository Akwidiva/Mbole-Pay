import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

// GET /api/disputes?groupId=xxx - List disputes for a group
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const groupId = request.nextUrl.searchParams.get("groupId");
    if (!groupId) {
      return NextResponse.json({ success: false, error: { message: "groupId is required" } }, { status: 400 });
    }

    // Verify user is member of group
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { message: "Not a member of this group" } },
        { status: 403 }
      );
    }

    // Get all disputes for group
    const disputes = await prisma.dispute.findMany({
      where: { groupId },
      include: {
        votes: {
          select: {
            vote: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate vote counts
    const formattedDisputes = disputes.map((dispute) => {
      const upholdCount = dispute.votes.filter((v) => v.vote === "UPHOLD").length;
      const rejectCount = dispute.votes.filter((v) => v.vote === "REJECT").length;

      return {
        id: dispute.id,
        title: dispute.title,
        description: dispute.description,
        status: dispute.status,
        groupId: dispute.groupId,
        createdBy: dispute.createdBy,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
        votes: {
          uphold: upholdCount,
          reject: rejectCount,
          total: upholdCount + rejectCount,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedDisputes,
    });
  } catch (error: any) {
    console.error("GET /api/disputes error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch disputes" } },
      { status: 500 }
    );
  }
}

// POST /api/disputes - Create new dispute
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, title, description } = body;

    if (!groupId || !title) {
      return NextResponse.json(
        { success: false, error: { message: "groupId and title are required" } },
        { status: 400 }
      );
    }

    // Verify user is member of group
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { message: "Not a member of this group" } },
        { status: 403 }
      );
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        groupId,
        title,
        description: description || null,
        createdBy: session.user.id,
        status: "OPEN",
      },
      include: {
        votes: {
          select: { vote: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...dispute,
          votes: {
            uphold: 0,
            reject: 0,
            total: 0,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/disputes error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to create dispute" } },
      { status: 500 }
    );
  }
}
