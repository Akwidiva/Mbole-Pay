import prisma from "@/lib/db"
import { PaymentFactory } from "@/lib/payments/payment-factory"
import { enqueuePayoutRetry } from "@/lib/queue/enqueue"

/**
 * Returns memberships in payout rotation order: non-admin members first (by
 * join date), then admin(s) last. This ensures the admin who starts the cycle
 * is never the first recipient — any other member gets paid first.
 */
export function payoutOrderedMemberships<T extends { role: string }>(memberships: T[]): T[] {
  const members = memberships.filter((m) => m.role !== "ADMIN")
  const admins = memberships.filter((m) => m.role === "ADMIN")
  return [...members, ...admins]
}

/**
 * Check if all contributions for a cycle are PAID, and if so fire the Fapshi
 * payout transfer to the recipient. Idempotent — safe to call multiple times.
 */
export async function triggerPayoutIfComplete(groupId: string, cycle: number) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })
  if (!group) return

  if (group.currentCycle !== cycle) return

  const existingPayout = await prisma.payout.findFirst({ where: { groupId, cycle } })
  if (existingPayout && existingPayout.status !== "SCHEDULED") return

  const contributions = await prisma.contribution.findMany({ where: { groupId, cycle } })
  if (contributions.length === 0) return
  if (!contributions.every((c) => c.status === "PAID")) return

  const memberCount = group.memberships.length
  const totalPool = group.contributionAmount * memberCount
  const ordered = payoutOrderedMemberships(group.memberships)

  let recipientMembership
  if (group.payoutOrder === "LOTTERY" && existingPayout) {
    recipientMembership = ordered.find((m) => m.userId === existingPayout.recipientId)
  } else {
    const idx = group.currentRecipientIndex % memberCount
    recipientMembership = ordered[idx]
  }

  if (!recipientMembership) return

  const recipientPhone = recipientMembership.user.phone
  if (!recipientPhone) {
    console.error("[payout] recipient has no phone number", { userId: recipientMembership.userId })
    return
  }

  let payout
  if (existingPayout) {
    payout = await prisma.payout.update({
      where: { id: existingPayout.id },
      data: { status: "PROCESSING", processedDate: new Date() },
    })
  } else {
    payout = await prisma.payout.create({
      data: {
        groupId,
        recipientId: recipientMembership.userId,
        amount: totalPool,
        currency: "XAF",
        status: "PROCESSING",
        provider: "FAPSHI",
        phoneNumber: recipientPhone,
        scheduledDate: new Date(),
        cycle,
      },
    })
  }

  try {
    const fapshi = PaymentFactory.getProvider("FAPSHI" as any)
    await fapshi.transfer({
      amount: totalPool,
      phoneNumber: recipientPhone,
      externalId: `payout-${groupId}-cycle-${cycle}`,
      description: `Njangi payout — ${group.name} cycle ${cycle}`,
    })

    // Mark PROCESSING (transfer accepted by Fapshi) — webhook will confirm actual delivery
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: "PROCESSING", processedDate: new Date() },
    })

    // Advance the cycle now so the group isn't blocked waiting for the delivery webhook
    const nextCycle = group.currentCycle + 1
    const nextRecipientIndex = (group.currentRecipientIndex + 1) % memberCount
    await prisma.group.update({
      where: { id: groupId },
      data: { currentCycle: nextCycle, currentRecipientIndex: nextRecipientIndex },
    })

    console.log(`[payout] cycle ${cycle} transfer accepted — awaiting Fapshi delivery webhook`)

    // Notifications + blockchain fire when Fapshi sends the payout webhook (SUCCESSFUL status)
    // See: app/api/payments/webhook/route.ts payout branch

    // Auto-start the next cycle immediately so members can begin contributing
    autoStartNextCycle(groupId, nextCycle, group.frequency, group.memberships, group.contributionAmount, nextRecipientIndex, group.payoutOrder).catch(
      (err) => console.error("[payout] auto-start next cycle failed:", err.message)
    )
  } catch (err: any) {
    await prisma.payout.update({
      where: { id: payout.id },
      data: { status: "FAILED", errorMessage: err.message },
    })
    console.error("[payout] Fapshi transfer failed — scheduling retry:", err.message)

    // FR-07/FR-08: enqueue retry with 1h→4h→24h backoff; worker handles HELD + alerts on exhaustion
    enqueuePayoutRetry({
      payoutId: payout.id,
      groupId,
      cycle,
      requestedAt: new Date().toISOString(),
    }).catch((qErr) => console.error("[payout] failed to enqueue retry:", qErr.message))
  }
}

async function autoStartNextCycle(
  groupId: string,
  cycle: number,
  frequency: string,
  memberships: { userId: string }[],
  contributionAmount: number,
  nextRecipientIndex: number,
  payoutOrder: string,
) {
  const existing = await prisma.contribution.findFirst({ where: { groupId, cycle } })
  if (existing) return

  const allMemberships = await prisma.membership.findMany({
    where: { groupId },
    include: { user: { select: { id: true, phone: true } } },
    orderBy: { createdAt: "asc" },
  })
  const ordered = payoutOrderedMemberships(allMemberships)
  const nonAdminCount = ordered.filter((m) => m.role !== "ADMIN").length

  // Determine recipient for the new cycle
  let recipientUserId: string
  if (payoutOrder === "LOTTERY") {
    const eligibleCount = nonAdminCount > 0 ? nonAdminCount : ordered.length
    recipientUserId = ordered[Math.floor(Math.random() * eligibleCount)].userId
  } else {
    const idx = nextRecipientIndex % ordered.length
    recipientUserId = ordered[idx].userId
  }

  const dueDate = new Date()
  switch (frequency) {
    case "WEEKLY":    dueDate.setDate(dueDate.getDate() + 7); break
    case "BIWEEKLY":  dueDate.setDate(dueDate.getDate() + 14); break
    case "MONTHLY":   dueDate.setMonth(dueDate.getMonth() + 1); break
    case "QUARTERLY": dueDate.setMonth(dueDate.getMonth() + 3); break
    default:          dueDate.setMonth(dueDate.getMonth() + 1)
  }

  // Recipient's contribution is auto-PAID (offset against their incoming payout)
  await prisma.contribution.createMany({
    data: memberships.map((m) => ({
      userId: m.userId,
      groupId,
      amount: contributionAmount,
      cycle,
      status: m.userId === recipientUserId ? "PAID" : "PENDING",
      paidAt: m.userId === recipientUserId ? new Date() : null,
      dueDate,
    })),
  })

  const recipientContribution = await prisma.contribution.findFirst({
    where: { groupId, cycle, userId: recipientUserId },
  })
  if (recipientContribution) {
    await prisma.payment.create({
      data: {
        userId: recipientUserId,
        groupId,
        contributionId: recipientContribution.id,
        amount: contributionAmount,
        currency: "XAF",
        status: "COMPLETED",
        provider: "FAPSHI",
        phoneNumber: ordered.find((m) => m.userId === recipientUserId)?.user.phone || "",
        providerRef: `recipient-offset-${recipientContribution.id}`,
        retryCount: 0,
      },
    })

    recordContributionOnChain({
      dbGroupId: groupId,
      cycle,
      dbMemberId: recipientUserId,
      amount: contributionAmount,
      isRecipientOffset: true,
    }).catch((err) => console.warn("[blockchain] contribution record failed (non-fatal):", err.message))
  }

  if (payoutOrder === "LOTTERY") {
    const recipient = ordered.find((m) => m.userId === recipientUserId)!
    await prisma.payout.create({
      data: {
        groupId,
        recipientId: recipientUserId,
        amount: contributionAmount * memberships.length,
        currency: "XAF",
        status: "SCHEDULED",
        provider: "FAPSHI",
        phoneNumber: recipient.user.phone || "",
        scheduledDate: dueDate,
        cycle,
      },
    })
  }

  console.log(`[payout] auto-started cycle ${cycle} for group ${groupId}, due ${dueDate.toISOString()}`)
}
