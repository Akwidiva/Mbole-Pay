import prisma from "@/lib/db"

export type NotificationType =
  | "ROLE_ASSIGNED"
  | "ROLE_REMOVED"
  | "MEMBER_REMOVED"
  | "ADMIN_MESSAGE"
  | "PAYMENT_RECEIVED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"

export async function createNotification({
  userId,
  type,
  title,
  body,
  groupId,
}: {
  userId: string
  type: NotificationType
  title: string
  body: string
  groupId?: string
}) {
  return prisma.notification.create({
    data: { userId, type, title, body, groupId: groupId ?? null },
  })
}

export async function createNotificationsForGroup({
  groupId,
  excludeUserId,
  type,
  title,
  body,
}: {
  groupId: string
  excludeUserId?: string
  type: NotificationType
  title: string
  body: string
}) {
  const memberships = await prisma.membership.findMany({
    where: {
      groupId,
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    select: { userId: true },
  })

  if (memberships.length === 0) return

  await prisma.notification.createMany({
    data: memberships.map((m) => ({
      userId: m.userId,
      type,
      title,
      body,
      groupId,
    })),
  })
}
