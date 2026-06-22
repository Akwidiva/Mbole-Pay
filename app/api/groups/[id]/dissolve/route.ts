import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { triggerPayoutIfComplete } from "@/lib/services/payout-service"
import { createNotificationsForGroup } from "@/lib/services/notification-service"

/**
 * POST /api/groups/[id]/dissolve  (admin only)
 *
 * FR-11: Group dissolution —
 * 1. Blocks if any active (PENDING/PROCESSING) payments exist
 * 2. Executes immediate payout if all contributions for current cycle are paid
 * 3. Marks all remaining PENDING contributions as OVERDUE
 * 4. Sets group status to INACTIVE
 * 5. Notifies all members
 * 6. Marks smart contract inactive (non-blocking)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actor = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!actor) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const actorMembership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: actor.id, groupId } },
  })
  if (actorMembership?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can dissolve a group" }, { status: 403 })
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 })
  if (group.status === "INACTIVE") return NextResponse.json({ error: "Group is already dissolved" }, { status: 400 })

  // Block dissolution if payments are actively processing
  const activePayments = await prisma.payment.count({
    where: { groupId, status: { in: ["PENDING", "PROCESSING"] } },
  })
  if (activePayments > 0) {
    return NextResponse.json(
      { error: `${activePayments} payment(s) are still processing. Wait for them to complete before dissolving.` },
      { status: 400 }
    )
  }

  // Attempt immediate payout for the current cycle if all contributions are paid
  try {
    await triggerPayoutIfComplete(groupId, group.currentCycle)
  } catch {
    // Non-fatal — payout may have already fired or not be ready
  }

  // Mark remaining PENDING contributions as OVERDUE
  await prisma.contribution.updateMany({
    where: { groupId, status: "PENDING" },
    data: { status: "OVERDUE" },
  })

  // Mark group INACTIVE
  await prisma.group.update({
    where: { id: groupId },
    data: { status: "INACTIVE" },
  })

  // Notify all members
  await createNotificationsForGroup({
    groupId,
    excludeUserId: "",
    type: "ADMIN_MESSAGE",
    title: `Group dissolved — ${group.name}`,
    body: `"${group.name}" has been dissolved by the admin. Thank you for participating.`,
  }).catch(() => {})

  // Mark smart contract inactive (non-blocking)
  if (group.contractGroupId) {
    import("@/lib/blockchain/factory").then(({ markGroupInactiveOnChain }) => {
      if (typeof markGroupInactiveOnChain === "function") {
        markGroupInactiveOnChain({ dbGroupId: groupId, contractGroupId: group.contractGroupId! })
          .catch((err: Error) => console.warn("[blockchain] markGroupInactive failed (non-fatal):", err.message))
      }
    }).catch(() => {})
  }

  return NextResponse.json({
    success: true,
    data: { message: `"${group.name}" has been dissolved.`, dissolvedAt: new Date() },
  })
}
