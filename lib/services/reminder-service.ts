import prisma from "@/lib/db"
import { emailService } from "./email-service"
import { createNotification } from "./notification-service"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/** Called by the scheduler worker once per hour. */
export async function runReminderTick() {
  const now = new Date()

  await Promise.allSettled([
    sendContributionReminders(now),
    sendPayoutReminders(now),
  ])
}

// ─── Contribution reminders ─────────────────────────────────────────────────

async function sendContributionReminders(now: Date) {
  // Find all PENDING contributions due in the next 73 hours
  const cutoff73h = new Date(now.getTime() + 73 * 60 * 60 * 1000)
  const pending = await prisma.contribution.findMany({
    where: {
      status: "PENDING",
      dueDate: { lte: cutoff73h, gt: now },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      group: { select: { id: true, name: true, contributionAmount: true } },
    },
  })

  for (const contrib of pending) {
    const hoursLeft = (contrib.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    const paymentUrl = `${APP_URL}/dashboard/payments`

    if (hoursLeft <= 25 && hoursLeft > 23) {
      // 24-hour reminder — dedup by checking existing notification
      const already = await prisma.notification.findFirst({
        where: {
          userId: contrib.user.id,
          type: "CONTRIBUTION_REMINDER_24H",
          body: { contains: contrib.id },
        },
      })
      if (already) continue

      const title = `Contribution due tomorrow — ${contrib.group.name}`
      const body = `Your XAF ${contrib.amount.toLocaleString()} contribution to "${contrib.group.name}" is due in 24 hours. Pay now to avoid being marked overdue.`

      await Promise.allSettled([
        createNotification({ userId: contrib.user.id, type: "CONTRIBUTION_REMINDER_24H" as any, title, body, groupId: contrib.group.id }),
        emailService.sendContributionReminder(contrib.user.email, {
          amount: contrib.amount,
          currency: "XAF",
          groupName: contrib.group.name,
          dueDate: contrib.dueDate,
          paymentUrl,
        }),
      ])
    } else if (hoursLeft <= 73 && hoursLeft > 71) {
      // 72-hour reminder
      const already = await prisma.notification.findFirst({
        where: {
          userId: contrib.user.id,
          type: "CONTRIBUTION_REMINDER_72H" as any,
          body: { contains: contrib.id },
        },
      })
      if (already) continue

      const title = `Contribution due in 3 days — ${contrib.group.name}`
      const body = `Your XAF ${contrib.amount.toLocaleString()} contribution to "${contrib.group.name}" is due in 3 days. Plan ahead and pay on time.`

      await Promise.allSettled([
        createNotification({ userId: contrib.user.id, type: "CONTRIBUTION_REMINDER_72H" as any, title, body, groupId: contrib.group.id }),
        emailService.sendContributionReminder(contrib.user.email, {
          amount: contrib.amount,
          currency: "XAF",
          groupName: contrib.group.name,
          dueDate: contrib.dueDate,
          paymentUrl,
        }),
      ])
    }
  }
}

// ─── Payout reminders ────────────────────────────────────────────────────────

async function sendPayoutReminders(now: Date) {
  const cutoff49h = new Date(now.getTime() + 49 * 60 * 60 * 1000)
  const pending = await prisma.payout.findMany({
    where: {
      status: { in: ["PENDING", "SCHEDULED"] },
      scheduledDate: { lte: cutoff49h, gt: now },
    },
    include: {
      recipient: { select: { id: true, email: true, name: true } },
      group: { select: { id: true, name: true } },
    },
  })

  for (const payout of pending) {
    const hoursLeft = (payout.scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    const payoutUrl = `${APP_URL}/dashboard`

    if (hoursLeft <= 25 && hoursLeft > 23) {
      const already = await prisma.notification.findFirst({
        where: { userId: payout.recipient.id, type: "PAYOUT_REMINDER_24H" as any, body: { contains: payout.id } },
      })
      if (already) continue

      const title = `Payout arriving tomorrow — ${payout.group.name}`
      const body = `Your XAF ${payout.amount.toLocaleString()} payout from "${payout.group.name}" will be sent to your MoMo number in 24 hours.`

      await Promise.allSettled([
        createNotification({ userId: payout.recipient.id, type: "PAYOUT_REMINDER_24H" as any, title, body, groupId: payout.group.id }),
        emailService.sendPayoutNotification(payout.recipient.email, {
          amount: payout.amount,
          currency: "XAF",
          groupName: payout.group.name,
          scheduledDate: payout.scheduledDate,
          payoutUrl,
        }),
      ])
    } else if (hoursLeft <= 49 && hoursLeft > 47) {
      const already = await prisma.notification.findFirst({
        where: { userId: payout.recipient.id, type: "PAYOUT_REMINDER_48H" as any, body: { contains: payout.id } },
      })
      if (already) continue

      const title = `Payout scheduled in 2 days — ${payout.group.name}`
      const body = `Your XAF ${payout.amount.toLocaleString()} payout from "${payout.group.name}" is scheduled in 48 hours.`

      await Promise.allSettled([
        createNotification({ userId: payout.recipient.id, type: "PAYOUT_REMINDER_48H" as any, title, body, groupId: payout.group.id }),
        emailService.sendPayoutNotification(payout.recipient.email, {
          amount: payout.amount,
          currency: "XAF",
          groupName: payout.group.name,
          scheduledDate: payout.scheduledDate,
          payoutUrl,
        }),
      ])
    }
  }
}

// ─── Immediate event notifications ──────────────────────────────────────────

export async function notifyPaymentReceived({
  userId,
  userEmail,
  userName,
  amount,
  groupId,
  groupName,
}: {
  userId: string
  userEmail: string
  userName?: string
  amount: number
  groupId: string
  groupName: string
}) {
  const title = `Payment confirmed — ${groupName}`
  const body = `Your contribution of XAF ${amount.toLocaleString()} to "${groupName}" has been received and confirmed.`

  await Promise.allSettled([
    createNotification({ userId, type: "PAYMENT_RECEIVED", title, body, groupId }),
    emailService.sendPaymentConfirmed(userEmail, { userName: userName || "Member", amount, groupName }),
  ])
}

export async function notifyDisputeFiled({
  groupId,
  groupName,
  disputeTitle,
  filedByName,
  excludeUserId,
}: {
  groupId: string
  groupName: string
  disputeTitle: string
  filedByName: string
  excludeUserId: string
}) {
  const members = await prisma.membership.findMany({
    where: { groupId, userId: { not: excludeUserId } },
    include: { user: { select: { id: true, email: true } } },
  })

  const title = `New dispute in ${groupName}`
  const disputeUrl = `${APP_URL}/dashboard/disputes`

  await Promise.allSettled(
    members.map((m) =>
      Promise.allSettled([
        createNotification({
          userId: m.user.id,
          type: "ADMIN_MESSAGE" as any,
          title,
          body: `"${disputeTitle}" was filed by ${filedByName}. Open the Disputes section to review and vote.`,
          groupId,
        }),
        emailService.sendDisputeNotification(m.user.email, {
          disputeTitle,
          groupName,
          filedBy: filedByName,
          disputeUrl,
        }),
      ])
    )
  )
}

// FR-08: member has been marked delinquent after 3 failed payment retries
export async function notifyMemberDelinquent({
  userId,
  userEmail,
  userName,
  groupId,
  groupName,
  failedAmount,
}: {
  userId: string
  userEmail: string
  userName?: string
  groupId: string
  groupName: string
  failedAmount: number
}) {
  const title = `Payment overdue — ${groupName}`
  const body = `Your XAF ${failedAmount.toLocaleString()} contribution to "${groupName}" failed 3 times and has been marked overdue. Please contact your group admin to resolve this.`

  // Notify the delinquent member
  await Promise.allSettled([
    createNotification({ userId, type: "PAYMENT_RECEIVED" as any, title, body, groupId }),
    emailService.sendPaymentConfirmed(userEmail, {
      userName: userName || "Member",
      amount: failedAmount,
      groupName,
    }),
  ])

  // Notify all admins in the group
  const admins = await prisma.membership.findMany({
    where: { groupId, role: "ADMIN" },
    include: { user: { select: { id: true, email: true, name: true } } },
  })

  const adminTitle = `Member delinquent — ${groupName}`
  const adminBody = `${userName || userEmail} has been marked delinquent in "${groupName}" after 3 failed payment attempts of XAF ${failedAmount.toLocaleString()}.`

  await Promise.allSettled(
    admins.map((a) =>
      Promise.allSettled([
        createNotification({ userId: a.user.id, type: "ADMIN_MESSAGE" as any, title: adminTitle, body: adminBody, groupId }),
        emailService.sendPaymentConfirmed(a.user.email, {
          userName: a.user.name || "Admin",
          amount: failedAmount,
          groupName,
        }),
      ])
    )
  )
}

// FR-08: payout moved to HELD status after all retries exhausted — alert admin + recipient
export async function notifyPayoutHeld({
  recipientId,
  recipientEmail,
  recipientName,
  groupId,
  groupName,
  amount,
  payoutId,
}: {
  recipientId: string
  recipientEmail: string
  recipientName?: string
  groupId: string
  groupName: string
  amount: number
  payoutId: string
}) {
  const dashboardUrl = `${APP_URL}/dashboard`

  // Notify recipient
  const recipientTitle = `Payout delayed — ${groupName}`
  const recipientBody = `Your XAF ${amount.toLocaleString()} payout from "${groupName}" could not be processed automatically and is being held. Your admin has been notified to release it manually.`

  await Promise.allSettled([
    createNotification({ userId: recipientId, type: "PAYMENT_RECEIVED" as any, title: recipientTitle, body: recipientBody, groupId }),
    emailService.sendPayoutNotification(recipientEmail, {
      amount,
      currency: "XAF",
      groupName,
      scheduledDate: new Date(),
      payoutUrl: dashboardUrl,
    }),
  ])

  // Notify all admins
  const admins = await prisma.membership.findMany({
    where: { groupId, role: "ADMIN" },
    include: { user: { select: { id: true, email: true, name: true } } },
  })

  const adminTitle = `Action required: payout held — ${groupName}`
  const adminBody = `The XAF ${amount.toLocaleString()} payout to ${recipientName || recipientEmail} in "${groupName}" failed all retry attempts and is now HELD. Log in to the admin dashboard to release it manually. Payout ID: ${payoutId}`

  await Promise.allSettled(
    admins.map((a) =>
      Promise.allSettled([
        createNotification({ userId: a.user.id, type: "ADMIN_MESSAGE" as any, title: adminTitle, body: adminBody, groupId }),
        emailService.sendPayoutNotification(a.user.email, {
          amount,
          currency: "XAF",
          groupName,
          scheduledDate: new Date(),
          payoutUrl: `${APP_URL}/admin/deferred-payouts`,
        }),
      ])
    )
  )
}

export async function notifyContributorsPayoutComplete({
  groupId,
  groupName,
  cycle,
  totalPool,
  recipientName,
}: {
  groupId: string
  groupName: string
  cycle: number
  totalPool: number
  recipientName?: string
}) {
  const contributions = await prisma.contribution.findMany({
    where: { groupId, cycle, status: "PAID" },
    include: { user: { select: { id: true, email: true, name: true } } },
  })

  const title = `Payout confirmed — ${groupName}`

  await Promise.allSettled(
    contributions.map((c) => {
      const body = `Your XAF ${c.amount.toLocaleString()} contribution to "${groupName}" (cycle ${cycle}) is confirmed. The full pool of XAF ${totalPool.toLocaleString()} was sent to ${recipientName || "the recipient"}.`
      return Promise.allSettled([
        createNotification({ userId: c.user.id, type: "PAYMENT_RECEIVED", title, body, groupId }),
        emailService.sendPaymentConfirmed(c.user.email, {
          userName: c.user.name || "Member",
          amount: c.amount,
          groupName,
        }),
      ])
    })
  )
}

export async function notifyPayoutCompleted({
  userId,
  userEmail,
  amount,
  groupId,
  groupName,
}: {
  userId: string
  userEmail: string
  amount: number
  groupId: string
  groupName: string
}) {
  const title = `Payout sent — ${groupName}`
  const body = `XAF ${amount.toLocaleString()} from "${groupName}" has been sent to your MTN MoMo number.`

  await Promise.allSettled([
    createNotification({ userId, type: "PAYMENT_RECEIVED", title, body, groupId }),
    emailService.sendPayoutNotification(userEmail, {
      amount,
      currency: "XAF",
      groupName,
      scheduledDate: new Date(),
      payoutUrl: `${APP_URL}/dashboard`,
    }),
  ])
}
