import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET: List contributions for user in a group
export async function GET(
  request: NextRequest,
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

    const groupId = params.id

    // Verify user is member of group
    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } },
    })

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 })
    }

    const contributions = await prisma.contribution.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json({ contributions }, { status: 200 })
  } catch (error) {
    console.error("Get contributions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    )
  }
}

// POST: Create contribution schedule (admin only)
export async function POST(
  request: NextRequest,
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

    const groupId = params.id

    // Verify user is admin
    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } },
    })

    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create contributions" },
        { status: 403 }
      )
    }

    const { userId, amount, dueDate } = await request.json()

    if (!userId || !amount || !dueDate) {
      return NextResponse.json(
        { error: "UserId, amount, and dueDate are required" },
        { status: 400 }
      )
    }

    // Verify user is member of group
    const targetMembership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId, groupId } },
    })

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Target user is not a member of this group" },
        { status: 404 }
      )
    }

    const contribution = await prisma.contribution.create({
      data: {
        userId,
        groupId,
        amount,
        dueDate: new Date(dueDate),
        status: "PENDING",
      },
    })

    return NextResponse.json(
      { message: "Contribution created", contribution },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create contribution error:", error)
    return NextResponse.json(
      { error: "Failed to create contribution" },
      { status: 500 }
    )
  }
}

// PATCH: Mark contribution as paid
export async function PATCH(
  request: NextRequest,
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

    const { contributionId } = await request.json()

    if (!contributionId) {
      return NextResponse.json({ error: "Contribution ID is required" }, { status: 400 })
    }

    const contribution = await prisma.contribution.findUnique({
      where: { id: contributionId },
    })

    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 })
    }

    // Verify user is admin or treasurer of group
    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: contribution.groupId,
        },
      },
    })

    if (!membership || (membership.role !== "ADMIN" && membership.role !== "TREASURER")) {
      return NextResponse.json(
        { error: "Only admins or treasurers can mark payments" },
        { status: 403 }
      )
    }

    const updated = await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    })

    return NextResponse.json(
      { message: "Contribution marked as paid", contribution: updated },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update contribution error:", error)
    return NextResponse.json(
      { error: "Failed to update contribution" },
      { status: 500 }
    )
  }
}
