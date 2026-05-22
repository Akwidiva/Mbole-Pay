import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import prisma from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const invitation = await prisma.groupInvitation.findUnique({
      where: { token: params.token },
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
        where: { token: params.token },
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
        where: { token: params.token },
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
      where: { token: params.token },
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
