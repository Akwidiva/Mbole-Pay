import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

/**
 * GET /api/admin/deferred-payouts
 * Returns FAILED/HELD payouts and delinquent members for admin dashboard.
 * Accessible to group admins and super-admins only.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get("groupId")

  // Resolve which groups this user admins
  const adminMemberships = await prisma.membership.findMany({
    where: {
      userId: user.id,
      role: "ADMIN",
      ...(groupId ? { groupId } : {}),
    },
    select: { groupId: true },
  })

  const isSystemAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role)
  const adminGroupIds = adminMemberships.map((m) => m.groupId)

  if (!isSystemAdmin && adminGroupIds.length === 0) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const groupFilter = isSystemAdmin
    ? groupId ? { groupId } : {}
    : { groupId: { in: adminGroupIds } }

  const [deferredPayouts, delinquentMembers] = await Promise.all([
    prisma.payout.findMany({
      where: { status: { in: ["FAILED", "HELD", "PROCESSING"] }, ...groupFilter },
      include: {
        recipient: { select: { id: true, name: true, email: true, phone: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.membership.findMany({
      where: { isDelinquent: true, ...groupFilter },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { delinquentAt: "desc" },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      deferredPayouts: deferredPayouts.map((p) => ({
        id: p.id,
        groupId: p.groupId,
        groupName: p.group.name,
        recipient: p.recipient,
        amount: p.amount,
        currency: p.currency,
        cycle: p.cycle,
        status: p.status,
        retryCount: p.retryCount,
        lastRetry: p.lastRetry,
        errorMessage: p.errorMessage,
        escrowReason: p.escrowReason,
        scheduledDate: p.scheduledDate,
        updatedAt: p.updatedAt,
      })),
      delinquentMembers: delinquentMembers.map((m) => ({
        membershipId: m.id,
        groupId: m.groupId,
        groupName: m.group.name,
        user: m.user,
        delinquentAt: m.delinquentAt,
      })),
    },
    timestamp: new Date(),
  })
}
