import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: { select: { groupId: true } } },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const groupIds = user.memberships.map(m => m.groupId)

    const disputes = await prisma.dispute.findMany({
      where: {
        groupId: { in: groupIds },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        votes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get member count for each group
    const formattedDisputes = await Promise.all(disputes.map(async (dispute) => {
      const memberCount = await prisma.membership.count({
        where: {
          groupId: dispute.groupId,
        },
      })

      const votesFor = dispute.votes.filter(v => v.vote === 'UPHOLD').length
      const votesAgainst = dispute.votes.filter(v => v.vote === 'REJECT').length

      return {
        id: dispute.id,
        title: dispute.title,
        description: dispute.description || '',
        group: dispute.group.name,
        status: dispute.status,
        votesFor,
        votesAgainst,
        totalMembers: memberCount,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
      }
    }))

    return NextResponse.json(formattedDisputes)
  } catch (error) {
    console.error("Error fetching disputes:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
