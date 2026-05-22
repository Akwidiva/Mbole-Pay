import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"

/**
 * GET /api/admin/groups
 * Get all groups (admin only)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all groups
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: {
            members: true,
            contributions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
