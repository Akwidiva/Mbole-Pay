import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { v4 as uuid } from "uuid"
import prisma from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { checkGroupRole, roleErrorResponse } from "@/lib/role-middleware"
import { sendGroupInvitation } from "@/lib/notifications/utils"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const roleCheck = await checkGroupRole(params.id, "ADMIN")
  if (!roleCheck.authorized) {
    return roleErrorResponse(roleCheck.error, 403)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, inviteCode: true },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const session = await getServerSession(authOptions)
    const inviter = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, email: true, phone: true },
        })
      : null

    if (!inviter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: (await prisma.user.findUnique({ where: { email } }))?.id || "",
          groupId: group.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 })
    }

    const existingPending = await prisma.groupInvitation.findFirst({
      where: {
        groupId: group.id,
        email,
        status: "PENDING",
      },
    })

    if (existingPending) {
      return NextResponse.json({ error: "An invitation is already pending for this email" }, { status: 409 })
    }

    const invitation = await prisma.groupInvitation.create({
      data: {
        token: uuid(),
        groupId: group.id,
        invitedById: inviter.id,
        email,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: {
        group: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, email: true, name: true } },
      },
    })

    const invitee = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, phone: true },
    })

    if (invitee) {
      await sendGroupInvitation(
        invitee.id,
        invitee.email,
        invitee.phone || "",
        group.name,
        group.inviteCode,
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/invites/${invitation.token}`
      )
    }

    return NextResponse.json(
      {
        message: "Invitation created",
        invitation,
        acceptUrl: `/invites/${invitation.token}`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create invitation error:", error)
    return NextResponse.json(
      {
        error: "Failed to create invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
