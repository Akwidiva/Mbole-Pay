import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { createLogger } from "@/lib/observability/logger"
import { recordApiError } from "@/lib/observability/metrics"

const logger = createLogger("admin.users")

/**
 * GET /api/admin/users?q=&role=&kycStatus=&page=&pageSize=
 * Get users (admin only) — search, filter, paginate
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      logger.warn("Admin users request rejected: unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!["ADMIN","SUPER_ADMIN"].includes(user?.role)) {
      logger.warn("Admin users request rejected: forbidden", { email: session.user.email, role: user?.role })
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""
    const role = searchParams.get("role") || ""
    const kycStatus = searchParams.get("kycStatus") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10) || 10))

    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ]
    }
    if (role) where.role = role
    if (kycStatus) where.kycStatus = kycStatus

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          suspended: true,
          kycStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ users, total, page, pageSize })
  } catch (error) {
    recordApiError("/api/admin/users", 500)
    logger.error("Error fetching users", { error: String(error) })
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
