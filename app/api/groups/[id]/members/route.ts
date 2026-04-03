// app/api/groups/[id]/members/route.ts
import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { userHasPermission } from "@/lib/rbac"

/**
 * GET /api/groups/[id]/members
 * List all members of a group
 * Requires: members:view permission (TREASURER+)
 */
export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  try {
    // Check permission to view members (requires members:view permission)
    if (session?.user?.id) {
      const hasPermission = await userHasPermission(session.user.id, params.id, "members:view")
      if (!hasPermission) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to view group members" },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const memberships = await prisma.membership.findMany({
      where: { groupId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    })

    if (!memberships.length) {
      return NextResponse.json(
        { message: "No members found", members: [] },
        { status: 200 }
      )
    }

    // Calculate member statistics
    const membersWithStats = await Promise.all(
      memberships.map(async (m) => {
        const contributions = await prisma.contribution.findMany({
          where: { userId: m.userId, groupId: params.id },
        })

        const stats = {
          totalContributions: contributions.reduce((sum, c) => sum + c.amount, 0),
          paid: contributions.filter((c) => c.status === "PAID").length,
          pending: contributions.filter((c) => c.status === "PENDING").length,
          overdue: contributions.filter((c) => c.status === "OVERDUE").length,
        }

        return {
          ...m,
          stats,
        }
      })
    )

    return NextResponse.json(
      { members: membersWithStats, count: membersWithStats.length },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Get members error:", error)
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/groups/[id]/members/[userId]
 * Update member role (admin only)
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

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!admin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if requester is admin
    const adminMembership = await prisma.membership.findUnique({
      where: {
        userId_groupId: { userId: admin.id, groupId: params.id },
      },
    })

    if (!adminMembership || adminMembership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can manage members" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { userId, newRole } = body

    // Validate input
    if (!userId || !newRole) {
      return NextResponse.json(
        { error: "userId and newRole are required" },
        { status: 400 }
      )
    }

    const validRoles = ["ADMIN", "TREASURER", "MEMBER"]
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN, TREASURER, or MEMBER" },
        { status: 400 }
      )
    }

    // Update member role
    const updatedMembership = await prisma.membership.update({
      where: {
        userId_groupId: { userId, groupId: params.id },
      },
      data: { role: newRole },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(
      {
        message: "Member role updated successfully",
        membership: updatedMembership,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Update member error:", error)
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/groups/[id]/members/[userId]
 * Remove member from group (admin only)
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

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!admin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if requester is admin
    const adminMembership = await prisma.membership.findUnique({
      where: {
        userId_groupId: { userId: admin.id, groupId: params.id },
      },
    })

    if (!adminMembership || adminMembership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can remove members" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Remove member
    await prisma.membership.delete({
      where: {
        userId_groupId: { userId, groupId: params.id },
      },
    })

    return NextResponse.json(
      { message: "Member removed from group successfully" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Remove member error:", error)
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    )
  }
}
