import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"

/**
 * GET /api/user/disputes
 * Get all disputes from user's groups
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          select: { groupId: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get disputes from all user's groups
    const disputes = await prisma.dispute.findMany({
      where: {
        groupId: {
          in: user.memberships.map(m => m.groupId),
        },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        votes: {
          select: {
            vote: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(disputes)
  } catch (error) {
    console.error("Error fetching user disputes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
