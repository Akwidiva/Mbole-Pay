import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { createLogger } from "@/lib/observability/logger"
import { recordApiError } from "@/lib/observability/metrics"

const logger = createLogger("admin.disputes")

/**
 * GET /api/admin/disputes
 * Get all disputes (admin only)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      logger.warn("Admin disputes request rejected: unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!["ADMIN","SUPER_ADMIN"].includes(user?.role)) {
      logger.warn("Admin disputes request rejected: forbidden", { email: session.user.email, role: user?.role })
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all disputes
    const disputes = await prisma.dispute.findMany({
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(disputes)
  } catch (error) {
    recordApiError("/api/admin/disputes", 500)
    logger.error("Error fetching disputes", { error: String(error) })
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
