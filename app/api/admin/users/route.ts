import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { createLogger } from "@/lib/observability/logger"
import { recordApiError } from "@/lib/observability/metrics"

const logger = createLogger("admin.users")

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      logger.warn("Admin users request rejected: unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (user?.role !== "ADMIN") {
      logger.warn("Admin users request rejected: forbidden", { email: session.user.email, role: user?.role })
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    recordApiError("/api/admin/users", 500)
    logger.error("Error fetching users", { error: String(error) })
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
