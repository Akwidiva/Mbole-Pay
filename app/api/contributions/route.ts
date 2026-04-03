// app/api/contributions/route.ts
import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { userHasPermission } from "@/lib/rbac"

/**
 * GET /api/contributions
 * List contributions with filtering
 */
export async function GET(req: NextRequest) {
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

    // Get query parameters for filtering
    const url = new URL(req.url)
    const groupId = url.searchParams.get("groupId")
    const status = url.searchParams.get("status")
    const userId = url.searchParams.get("userId") || user.id
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const skip = parseInt(url.searchParams.get("skip") || "0")

    // Build filter
    const where: any = {}
    if (groupId) where.groupId = groupId
    if (status) where.status = status
    // Users can only see their own contributions unless they're an admin
    where.userId = userId

    const contributions = await prisma.contribution.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: limit,
      skip,
    })

    const total = await prisma.contribution.count({ where })

    return NextResponse.json(
      {
        contributions,
        pagination: {
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Get contributions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contributions
 * Create new contribution (treasurer only)
 * Requires: contributions:create permission (TREASURER+)
 */
export async function POST(req: NextRequest) {
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
    const { groupId, userId, amount, dueDate } = body

    // Validate input
    if (!groupId || !userId || !amount || !dueDate) {
      return NextResponse.json(
        { error: "groupId, userId, amount, and dueDate are required" },
        { status: 400 }
      )
    }

    if (typeof amount !== "number" || amount < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 XAF" },
        { status: 400 }
      )
    }

    // Check permission to create contribution (requires contributions:create)
    const hasPermission = await userHasPermission(user.id, groupId, "contributions:create")
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to create contributions" },
        { status: 403 }
      )
    }

    // Verify target user is member of group
    const targetMember = await prisma.membership.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    })

    if (!targetMember) {
      return NextResponse.json(
        { error: "User is not a member of this group" },
        { status: 400 }
      )
    }

    // Create contribution
    const contribution = await prisma.contribution.create({
      data: {
        amount,
        dueDate: new Date(dueDate),
        status: "PENDING",
        userId,
        groupId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(
      { message: "Contribution created successfully", contribution },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create contribution error:", error)
    return NextResponse.json(
      { error: "Failed to create contribution" },
      { status: 500 }
    )
  }
}
