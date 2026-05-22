// app/api/groups/[id]/route.ts
import { NextResponse, NextRequest } from "next/server"
import prisma from '@/lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('GET /api/groups/[id] params:', params)
    const session = await getServerSession(authOptions)
    console.log('Session from getServerSession:', session?.user?.email)
    if (!session?.user?.email) {
      console.log('No session available')
      // In development allow unauthenticated access for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode: proceeding without session')
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const { id } = params

    let user = null
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })
      console.log('Found user:', user?.id)

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Verify user is a member of the group
      const membership = await prisma.membership.findFirst({
        where: {
          groupId: id,
          userId: user.id,
        },
      })
      console.log('Membership found:', membership?.id)

      if (!membership) {
        return NextResponse.json(
          { error: "You don't have access to this group" },
          { status: 403 }
        )
      }
    } else {
      console.log('No authenticated user; skipping membership check (dev)')
    }

    // Fetch the group with all related data
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        contributions: {
          select: {
            id: true,
            userId: true,
            amount: true,
            status: true,
            dueDate: true,
            createdAt: true,
          },
        },
        _count: {
          select: { memberships: true, contributions: true },
        },
      },
    })
    console.log('Group fetch result:', !!group)

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        data: {
          id: group.id,
          name: group.name,
          description: group.description,
          status: group.status,
          contributionAmount: group.contributionAmount,
          frequency: group.frequency,
          cycleType: group.cycleType,
          inviteCode: group.inviteCode,
          creator_id: group.creator_id,
          createdAt: group.createdAt,
          _count: {
            memberships: group._count.memberships,
            contributions: group._count.contributions,
          },
          memberships: group.memberships,
          contributions: group.contributions,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Get group error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: "Failed to fetch group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
