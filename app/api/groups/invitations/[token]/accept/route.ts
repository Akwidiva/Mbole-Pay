import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
      include: {
        group: true,
      },
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation is no longer pending" }, { status: 409 })
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.groupInvitation.update({
        where: { token: token },
        data: { status: "EXPIRED" },
      })
      return NextResponse.json({ error: "Invitation has expired" }, { status: 410 })
    }

    if (session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({ error: "This invitation was sent to a different email" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Membership locked from first cycle until every member has received a payout
    const cycleStarted = await prisma.contribution.findFirst({
      where: { groupId: invitation.groupId },
    })
    if (cycleStarted) {
      const memberCount = await prisma.membership.count({ where: { groupId: invitation.groupId } })
      const completedPayouts = await prisma.payout.count({
        where: { groupId: invitation.groupId, status: "COMPLETED" },
      })
      if (completedPayouts < memberCount) {
        const remaining = memberCount - completedPayouts
        return NextResponse.json(
          {
            error: `The group rotation is still in progress — ${remaining} member${remaining === 1 ? "" : "s"} still waiting for their turn. You can join once everyone has received a payout.`,
          },
          { status: 409 }
        )
      }
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: invitation.groupId,
        },
      },
    })

    if (existingMembership) {
      await prisma.groupInvitation.update({
        where: { token: token },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      })

      return NextResponse.json({
        message: "You are already a member of this group",
        group: invitation.group,
      })
    }

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        groupId: invitation.groupId,
        role: "MEMBER",
      },
    })

    await prisma.groupInvitation.update({
      where: { token: token },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    })

    return NextResponse.json({
      message: "Invitation accepted",
      membership,
      group: invitation.group,
    })
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json(
      {
        error: "Failed to accept invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
