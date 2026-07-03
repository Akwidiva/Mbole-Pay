import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { createLogger } from "@/lib/observability/logger"

const logger = createLogger("admin.users.detail")

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return { ok: false as const, status: 401, error: "Unauthorized" }

  const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
    return { ok: false as const, status: 403, error: "Forbidden" }
  }
  return { ok: true as const, admin }
}

/**
 * PATCH /api/admin/users/[id]
 * body: { action: "suspend" | "reactivate" }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin()
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  const { action } = await req.json()
  if (!["suspend", "reactivate"].includes(action)) {
    return NextResponse.json({ error: "Action must be suspend or reactivate" }, { status: 400 })
  }

  if (params.id === check.admin.id && action === "suspend") {
    return NextResponse.json({ error: "You cannot suspend your own account" }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { suspended: action === "suspend" },
    select: { id: true, email: true, suspended: true },
  })

  logger.info(`Admin ${action}ed user`, { adminEmail: check.admin.email, targetEmail: target.email })

  return NextResponse.json({ updated: true, user: updated })
}

/**
 * DELETE /api/admin/users/[id]
 * Hard-deletes a user. Refuses if the user has ever been a Payout recipient
 * (financial record integrity) — suspend instead in that case.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin()
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

  if (params.id === check.admin.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const payoutCount = await prisma.payout.count({ where: { recipientId: params.id } })
  if (payoutCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: user has ${payoutCount} payout record(s) on file. Suspend the account instead.` },
      { status: 409 }
    )
  }

  try {
    await prisma.$transaction([
      prisma.membership.deleteMany({ where: { userId: params.id } }),
      prisma.disputeVote.deleteMany({ where: { voterId: params.id } }),
      prisma.user.delete({ where: { id: params.id } }),
    ])
  } catch (error) {
    logger.error("Failed to delete user", { error: String(error), targetId: params.id })
    return NextResponse.json({ error: "Failed to delete user — it may still have related records" }, { status: 500 })
  }

  logger.info("Admin deleted user", { adminEmail: check.admin.email, targetEmail: target.email })

  return NextResponse.json({ deleted: true })
}
