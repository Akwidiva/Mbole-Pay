import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

// GET /api/disputes/[id] - Get single dispute details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: {
        votes: {
          select: {
            vote: true,
          },
        },
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

    const upholdCount = dispute.votes.filter((v) => v.vote === "UPHOLD").length;
    const rejectCount = dispute.votes.filter((v) => v.vote === "REJECT").length;

    return NextResponse.json({
      success: true,
      data: {
        ...dispute,
        votes: {
          uphold: upholdCount,
          reject: rejectCount,
          total: upholdCount + rejectCount,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/disputes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to fetch dispute" } },
      { status: 500 }
    );
  }
}

// PUT /api/disputes/[id] - Update dispute (resolve)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: { message: "status is required" } },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
    });

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: { message: "Dispute not found" } },
        { status: 404 }
      );
    }

    // Verify user is admin or treasurer
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: dispute.groupId,
        },
      },
    });

    if (!membership || !["ADMIN", "TREASURER"].includes(membership.role)) {
      return NextResponse.json(
        { success: false, error: { message: "Only admins/treasurers can resolve disputes" } },
        { status: 403 }
      );
    }

    const updated = await prisma.dispute.update({
      where: { id: params.id },
      data: { status },
      include: {
        votes: {
          select: { vote: true },
        },
      },
    });

    const upholdCount = updated.votes.filter((v) => v.vote === "UPHOLD").length;
    const rejectCount = updated.votes.filter((v) => v.vote === "REJECT").length;

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        votes: {
          uphold: upholdCount,
          reject: rejectCount,
          total: upholdCount + rejectCount,
        },
      },
    });
  } catch (error: any) {
    console.error("PUT /api/disputes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to update dispute" } },
      { status: 500 }
    );
  }
}

// DELETE /api/disputes/[id] - Delete dispute (only creator or admin)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
    });

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: { message: "Dispute not found" } },
        { status: 404 }
      );
    }

    // Verify user is creator or admin
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

    if (dispute.createdBy !== session.user.id && membership.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { message: "Cannot delete this dispute" } },
        { status: 403 }
      );
    }

    await prisma.dispute.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      data: { id: params.id, deleted: true },
    });
  } catch (error: any) {
    console.error("DELETE /api/disputes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: { message: error.message || "Failed to delete dispute" } },
      { status: 500 }
    );
  }
}
