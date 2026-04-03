// app/api/contributions/[id]/route.ts
import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { userHasPermission } from "@/lib/rbac"

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
 * Requires: contributions:edit permission (TREASURER+)
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

    // Check permission to edit contribution (requires contributions:edit)
    const hasPermission = await userHasPermission(user.id, contribution.groupId, "contributions:edit")
    if (!hasPermission) {
      return NextResponse.json(
        {
          error: "Forbidden: You do not have permission to edit contributions",
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
 * Requires: contributions:delete permission (ADMIN only)
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

    // Check permission to delete contribution (requires contributions:delete)
    const hasPermission = await userHasPermission(user.id, contribution.groupId, "contributions:delete")
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete contributions" },
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
