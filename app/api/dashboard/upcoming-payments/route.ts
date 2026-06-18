import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const pending = await prisma.contribution.findMany({
      where: { userId: user.id, status: "PENDING" },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    })

    const now = new Date()
    const result = pending.map((c) => {
      const due = c.dueDate ? new Date(c.dueDate) : null
      const daysLeft = due
        ? Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null
      return {
        id: c.id,
        amount: c.amount,
        daysLeft,
        dueDate: c.dueDate,
        group: { id: c.group.id, name: c.group.name },
      }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[upcoming-payments] error:", error)
    return NextResponse.json({ error: "Failed to fetch upcoming payments" }, { status: 500 })
  }
}
