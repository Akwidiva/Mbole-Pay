import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { v4 as uuid } from "uuid"
import prisma from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { checkGroupRole, roleErrorResponse } from "@/lib/role-middleware"
import { emailService } from "@/lib/services/email-service"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const roleCheck = await checkGroupRole(id, "ADMIN")
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
      where: { id: id },
      select: { id: true, name: true, inviteCode: true },
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    const session = await getServerSession(authOptions)
    const inviter = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, name: true, email: true, phone: true },
        })
      : null

    if (!inviter) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Membership is locked once cycles start and stays locked until every current
    // member has received a payout (full rotation). Only then can new members join
    // for the next rotation.
    const cycleStarted = await prisma.contribution.findFirst({ where: { groupId: group.id } })
    if (cycleStarted) {
      const memberCount = await prisma.membership.count({ where: { groupId: group.id } })
      const completedPayouts = await prisma.payout.count({
        where: { groupId: group.id, status: "COMPLETED" },
      })
      const fullRotationDone = completedPayouts >= memberCount
      if (!fullRotationDone) {
        const remaining = memberCount - completedPayouts
        return NextResponse.json(
          {
            error: `The rotation is in progress. New members can only join after all ${memberCount} members have received a payout. ${remaining} member${remaining === 1 ? "" : "s"} still waiting for their turn.`,
          },
          { status: 409 }
        )
      }
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
      where: { groupId: group.id, email, status: "PENDING" },
    })

    // If invitation already exists, just resend the email
    const invitation = existingPending ?? await prisma.groupInvitation.create({
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

    const inviterName = inviter.name || inviter.email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/invites/${invitation.token}`

    await emailService.sendEmail({
      to: email,
      subject: `${inviterName} invited you to join ${group.name} on Mbole Pay`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1a1a2e">You've been invited!</h2>
          <p><strong>${inviterName}</strong> has invited you to join the savings group <strong>${group.name}</strong> on Mbole Pay.</p>
          <a href="${inviteLink}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
            Accept Invitation
          </a>
          <p style="color:#666;font-size:13px">This link expires in 7 days. If you don't have an account yet, you can sign up after clicking the link — you'll be added to the group automatically.</p>
          <p style="color:#aaa;font-size:12px">If you didn't expect this invitation, you can ignore this email.</p>
        </div>
      `,
    }).catch((err: any) => console.error("[invitation] email send failed:", err))

    return NextResponse.json(
      {
        message: existingPending ? "Invitation resent" : "Invitation created",
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
