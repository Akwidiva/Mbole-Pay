import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { createLogger } from "@/lib/observability/logger"
import { recordApiError } from "@/lib/observability/metrics"

const logger = createLogger("admin.groups")

/**
 * GET /api/admin/groups
 * Get all groups (admin only)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      logger.warn("Admin groups request rejected: unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!["ADMIN","SUPER_ADMIN"].includes(user?.role)) {
      logger.warn("Admin groups request rejected: forbidden", { email: session.user.email, role: user?.role })
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all groups
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
            contributions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(
      groups.map((group) => ({
        ...group,
        memberCount: group._count.memberships,
        contributionCount: group._count.contributions,
      }))
    )
  } catch (error) {
    recordApiError("/api/admin/groups", 500)
    logger.error("Error fetching groups", { error: String(error) })
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
