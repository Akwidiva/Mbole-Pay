// app/api/contributions/[id]/route.ts
import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

/**
 * GET /api/contributions/[id]
 * Get contribution details
 */
export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
    })

    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(contribution, { status: 200 })
  } catch (error: any) {
    console.error("Get contribution error:", error)
    return NextResponse.json(
      { error: "Failed to fetch contribution" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/contributions/[id]
 * Update contribution (mark as paid, etc.)
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

    const body = await req.json()
    const { status } = body

    // Validate status
    const validStatuses = ["PENDING", "PAID", "OVERDUE"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be PENDING, PAID, or OVERDUE" },
        { status: 400 }
      )
    }

    // Get contribution to verify permissions
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.id },
      include: { group: true },
    })

    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 }
      )
    }

    // Check if user is treasurer or admin of the group
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: contribution.groupId,
        },
      },
    })

    if (!membership || !["TREASURER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json(
        {
          error:
            "Only treasurers or admins can update contributions",
        },
        { status: 403 }
      )
    }

    // Update contribution
    const updatedContribution = await prisma.contribution.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === "PAID" && { paidAt: new Date() }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      {
        message: "Contribution updated successfully",
        contribution: updatedContribution,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Update contribution error:", error)
    return NextResponse.json(
      { error: "Failed to update contribution" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contributions/[id]
 * Delete contribution (admin only)
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

    // Get contribution
    const contribution = await prisma.contribution.findUnique({
      where: { id: params.id },
    })

    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 }
      )
    }

    // Check if user is admin of the group
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: contribution.groupId,
        },
      },
    })

    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can delete contributions" },
        { status: 403 }
      )
    }

    // Delete contribution
    await prisma.contribution.delete({
      where: { id: params.id },
    })

    return NextResponse.json(
      { message: "Contribution deleted successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Delete contribution error:", error)
    return NextResponse.json(
      { error: "Failed to delete contribution" },
      { status: 500 }
    )
  }
}
