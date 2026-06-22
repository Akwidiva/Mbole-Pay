import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { createNotificationsForGroup } from "@/lib/services/notification-service"
import { emailService } from "@/lib/services/email-service"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actor = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!actor) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: actor.id, groupId } },
  })
  if (membership?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can broadcast messages" }, { status: 403 })
  }

  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: "Message is required" }, { status: 400 })

  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } })
  const groupName = group?.name ?? "your group"
  const senderName = actor.name || "Admin"

  // In-app notifications for all members
  await createNotificationsForGroup({
    groupId,
    excludeUserId: actor.id,
    type: "ADMIN_MESSAGE",
    title: `Message from ${senderName} · ${groupName}`,
    body: message.trim(),
  })

  // Email all members
  const members = await prisma.membership.findMany({
    where: { groupId, userId: { not: actor.id } },
    include: { user: { select: { email: true, name: true } } },
  })

  await Promise.allSettled(
    members.map((m) =>
      emailService.sendGroupBroadcast(m.user.email, {
        userName: m.user.name || "Member",
        groupName,
        senderName,
        message: message.trim(),
      })
    )
  )

  return NextResponse.json({ ok: true })
}
