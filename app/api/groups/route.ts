// app/api/groups/route.ts
import { NextResponse, NextRequest } from "next/server"
import prisma from '@/lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { v4 as uuid } from "uuid"

export async function GET() {
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

    const groups = await prisma.group.findMany({
      where: {
        memberships: {
          some: { userId: user.id },
        },
      },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        contributions: {
          where: { userId: user.id },
          select: { id: true, status: true, amount: true, dueDate: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ groups }, { status: 200 })
  } catch (error) {
    console.error("Get groups error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: "Failed to fetch groups",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => null) as {
      name?: string
      description?: string
      contributionAmount?: number
      frequency?: string
      cycleType?: string
    } | null

    if (!body?.name || !body?.contributionAmount || !body?.frequency || !body?.cycleType) {
      return NextResponse.json(
        { error: "Name, contribution amount, frequency, and cycle type are required" },
        { status: 400 }
      )
    }

    // Generate unique invite code
    const inviteCode = uuid().split("-")[0].toUpperCase()

    // Create group
    const group = await prisma.group.create({
      data: {
        name: body.name,
        description: body.description,
        contributionAmount: body.contributionAmount,
        frequency: body.frequency,
        cycleType: body.cycleType,
        inviteCode,
        creator_id: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        memberships: true,
      },
    })

    return NextResponse.json(
      { message: "Group created successfully", group },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create group error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: "Failed to create group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
