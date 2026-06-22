import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { createNotification, createNotificationsForGroup } from "@/lib/services/notification-service"
import { emailService } from "@/lib/services/email-service"

async function resolveActor(session: any) {
  if (!session?.user?.email) return null
  return prisma.user.findUnique({ where: { email: session.user.email } })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  const actor = await resolveActor(session)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: actor.id, groupId } },
  })
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  const members = await prisma.membership.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    members: members.map((m) => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.createdAt,
      user: m.user,
    })),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  const actor = await resolveActor(session)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actorMembership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: actor.id, groupId } },
  })
  if (actorMembership?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 })
  }

  const { userId, role } = await req.json()
  if (!userId || !["ADMIN", "MEMBER"].includes(role)) {
    return NextResponse.json({ error: "Invalid userId or role" }, { status: 400 })
  }

  const target = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
    include: { user: { select: { name: true, email: true } }, group: { select: { name: true } } },
  })
  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const oldRole = target.role

  await prisma.membership.update({
    where: { userId_groupId: { userId, groupId } },
    data: { role },
  })

  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } })
  const targetName = target.user.name || "A member"
  const actorName = actor.name || "An admin"
  const groupName = group?.name ?? "the group"

  if (role === "ADMIN" && oldRole !== "ADMIN") {
    await Promise.allSettled([
      createNotification({ userId, type: "ROLE_ASSIGNED", title: "You've been made Admin", body: `${actorName} promoted you to Admin in "${groupName}".`, groupId }),
      createNotificationsForGroup({ groupId, excludeUserId: userId, type: "ROLE_ASSIGNED", title: `New Admin in ${groupName}`, body: `${targetName} has been promoted to Admin by ${actorName}.` }),
      emailService.sendRoleAssigned(target.user.email, { userName: targetName, role: "Admin", groupName, assignedBy: actorName }),
    ])
  }

  return NextResponse.json({ ok: true, role })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  const actor = await resolveActor(session)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actorMembership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: actor.id, groupId } },
  })
  if (actorMembership?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 })
  }

  const { userId } = await req.json()

  const [group, removedUser] = await Promise.all([
    prisma.group.findUnique({ where: { id: groupId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ])
  const groupName = group?.name ?? "the group"
  const removedName = removedUser?.name || "A member"
  const actorName = actor.name || "An admin"

  const removedEmail = (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? ""

  await prisma.membership.delete({
    where: { userId_groupId: { userId, groupId } },
  })

  await Promise.allSettled([
    createNotification({ userId, type: "MEMBER_REMOVED", title: "Removed from group", body: `You have been removed from "${groupName}" by ${actorName}.`, groupId }),
    createNotificationsForGroup({ groupId, excludeUserId: userId, type: "MEMBER_REMOVED", title: `Member removed from ${groupName}`, body: `${removedName} has been removed from the group by ${actorName}.` }),
    emailService.sendMemberRemoved(removedEmail, { userName: removedName, groupName, removedBy: actorName }),
  ])

  return NextResponse.json({ ok: true })
}
