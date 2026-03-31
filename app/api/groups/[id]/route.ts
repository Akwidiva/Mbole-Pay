// app/api/groups/[id]/route.ts
import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

/**
 * GET /api/groups/[id]
 * Get group details with members, contributions, and disputes
 */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        contributions: {
          select: {
            id: true,
            status: true,
            amount: true,
            dueDate: true,
            paidAt: true,
            userId: true,
          },
        },
        disputes: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            _count: { select: { votes: true } },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Calculate group statistics
    const totalContributions = group.contributions.reduce(
      (sum, c) => sum + (c.status === "PAID" ? c.amount : 0),
      0
    )
    const pendingContributions = group.contributions.filter(
      (c) => c.status === "PENDING"
    ).length

    return NextResponse.json({
      group,
      stats: {
        memberCount: group.memberships.length,
        totalContributions,
        pendingContributions,
        disputeCount: group.disputes.length,
      },
    })
  } catch (error: any) {
    console.error("Get group error:", error)
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/groups/[id]
 * Update group details (admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is group admin
    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } },
    })

    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only group admins can update group settings" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, contributionAmount, frequency, cycleType } =
      body

    // Validate input
    if (
      name &&
      (typeof name !== "string" || name.trim().length < 2)
    ) {
      return NextResponse.json(
        { error: "Group name must be at least 2 characters" },
        { status: 400 }
      )
    }

    if (
      contributionAmount &&
      (typeof contributionAmount !== "number" || contributionAmount < 100)
    ) {
      return NextResponse.json(
        { error: "Contribution amount must be at least 100 XAF" },
        { status: 400 }
      )
    }

    // Update group
    const updatedGroup = await prisma.group.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description && { description: description.trim() }),
        ...(contributionAmount && { contributionAmount }),
        ...(frequency && { frequency }),
        ...(cycleType && { cycleType }),
      },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    return NextResponse.json(
      { message: "Group updated successfully", group: updatedGroup },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Update group error:", error)
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/groups/[id]
 * Delete group (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is group creator/admin
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: { memberships: true },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } },
    })

    if (
      !membership ||
      (membership.role !== "ADMIN" && group.creator_id !== user.id)
    ) {
      return NextResponse.json(
        { error: "Only group creator can delete this group" },
        { status: 403 }
      )
    }

    // Soft delete by setting status to INACTIVE
    const deletedGroup = await prisma.group.update({
      where: { id: params.id },
      data: { status: "INACTIVE" },
    })

    return NextResponse.json(
      { message: "Group deleted successfully", group: deletedGroup },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Delete group error:", error)
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    )
  }
}