import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { emailService } from "@/lib/services/email-service"
import { createNotification, createNotificationsForGroup } from "@/lib/services/notification-service"

/**
 * POST /api/groups/[id]/members/exit
 * Member requests to leave a group. Starts a 7-day notice period.
 * If they have outstanding (PENDING) contributions, exit is blocked until settled.
 *
 * GET /api/groups/[id]/members/exit
 * Check current exit request status for the calling user.
 *
 * DELETE /api/groups/[id]/members/exit  (admin only)
 * Approve and execute the exit immediately (bypasses 7-day wait).
 */

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

  const exitDate = membership.exitRequestedAt
    ? new Date(membership.exitRequestedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null

  return NextResponse.json({
    success: true,
    data: {
      exitRequested: !!membership.exitRequestedAt,
      exitRequestedAt: membership.exitRequestedAt,
      exitExecutesAt: exitDate,
      daysRemaining: exitDate
        ? Math.max(0, Math.ceil((exitDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null,
    },
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  const actor = await resolveActor(session)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: actor.id, groupId } },
    include: { group: { select: { name: true } } },
  })
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 })

  if (membership.role === "ADMIN") {
    const otherAdmins = await prisma.membership.count({ where: { groupId, role: "ADMIN", userId: { not: actor.id } } })
    if (otherAdmins === 0) {
      return NextResponse.json(
        { error: "You are the only admin. Appoint another admin before leaving." },
        { status: 400 }
      )
    }
  }

  if (membership.exitRequestedAt) {
    return NextResponse.json({ error: "Exit already requested. Wait for the 7-day notice to complete." }, { status: 409 })
  }

  // Block if outstanding unpaid contributions exist
  const unpaid = await prisma.contribution.count({
    where: { groupId, userId: actor.id, status: "PENDING" },
  })
  if (unpaid > 0) {
    return NextResponse.json(
      { error: `You have ${unpaid} outstanding contribution(s). Settle them before requesting to exit.` },
      { status: 400 }
    )
  }

  await prisma.membership.update({
    where: { userId_groupId: { userId: actor.id, groupId } },
    data: { exitRequestedAt: new Date() },
  })

  const exitDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const groupName = membership.group.name

  // Notify admins
  const admins = await prisma.membership.findMany({
    where: { groupId, role: "ADMIN" },
    include: { user: { select: { id: true, email: true, name: true } } },
  })

  await Promise.allSettled([
    createNotification({
      userId: actor.id,
      type: "ADMIN_MESSAGE" as any,
      title: `Exit notice submitted — ${groupName}`,
      body: `Your 7-day exit notice has been submitted. Your membership ends on ${exitDate.toLocaleDateString()} unless you cancel.`,
      groupId,
    }),
    ...admins.map((a) =>
      createNotification({
        userId: a.user.id,
        type: "MEMBER_REMOVED" as any,
        title: `Member exit notice — ${groupName}`,
        body: `${actor.name || actor.email} has submitted a 7-day exit notice from "${groupName}". They will be removed on ${exitDate.toLocaleDateString()}.`,
        groupId,
      })
    ),
  ])

  return NextResponse.json({
    success: true,
    data: {
      exitRequestedAt: new Date(),
      exitExecutesAt: exitDate,
      message: `7-day notice started. Your membership ends on ${exitDate.toLocaleDateString()}.`,
    },
  })
}

// Admin: approve exit immediately
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  const actor = await resolveActor(session)
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actorMembership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: actor.id, groupId } },
  })
  if (actorMembership?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can approve exits" }, { status: 403 })
  }

  const { userId } = await req.json()
  const target = await prisma.membership.findUnique({
    where: { userId_groupId: { userId, groupId } },
    include: { user: { select: { name: true, email: true } }, group: { select: { name: true } } },
  })
  if (!target || !target.exitRequestedAt) {
    return NextResponse.json({ error: "No pending exit request for this member" }, { status: 404 })
  }

  await prisma.membership.delete({ where: { userId_groupId: { userId, groupId } } })

  await Promise.allSettled([
    createNotification({
      userId,
      type: "MEMBER_REMOVED" as any,
      title: `Exit approved — ${target.group.name}`,
      body: `Your exit from "${target.group.name}" has been approved by an admin.`,
      groupId,
    }),
    createNotificationsForGroup({
      groupId,
      excludeUserId: userId,
      type: "MEMBER_REMOVED",
      title: `Member left ${target.group.name}`,
      body: `${target.user.name || target.user.email} has left the group.`,
    }),
  ])

  return NextResponse.json({ success: true })
}
