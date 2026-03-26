import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { inviteCode } = await request.json()

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 })
    }

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode },
    })

    if (!group) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    // Check if user already a member
    const existingMembership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 409 }
      )
    }

    // Add user to group
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        groupId: group.id,
        role: "MEMBER",
      },
    })

    return NextResponse.json(
      { message: "Successfully joined group", group, membership },
      { status: 200 }
    )
  } catch (error) {
    console.error("Join group error:", error)
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 })
  }
}
