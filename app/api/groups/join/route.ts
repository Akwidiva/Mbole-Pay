import { NextResponse, NextRequest } from "next/server"
import prisma from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/groups/join called')
    // Read body early so dev fallback can use optional testEmail
    const body = await request.json().catch(() => ({}))
    console.log('Request body:', body)
    const session = await getServerSession(authOptions)
    console.log('Session:', !!session?.user?.email)
    let user = null
    if (session?.user?.email) {
      user = await prisma.user.findUnique({ where: { email: session.user.email } })
      console.log('User found via session:', user?.id)
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    } else {
      console.log('No session for join; using dev fallback user')
      if (process.env.NODE_ENV !== 'production') {
        const testEmail = body.testEmail || 'test@example.com'
        user = await prisma.user.findUnique({ where: { email: testEmail } })
        console.log('Dev fallback user:', testEmail, user?.id)
        if (!user) {
          return NextResponse.json({ error: 'Dev fallback user not found' }, { status: 404 })
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }
    const { inviteCode } = body

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 })
    }

    // Find group by invite code
    const group = await prisma.group.findUnique({
      where: { inviteCode },
    })
    console.log('Group by inviteCode:', !!group)

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
    console.log('Membership created:', membership.id)

    return NextResponse.json(
      { message: "Successfully joined group", group, membership },
      { status: 200 }
    )
  } catch (error) {
    console.error("Join group error:", error)
    return NextResponse.json({ error: "Failed to join group" }, { status: 500 })
  }
}
