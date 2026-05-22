import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { endOfMonth, differenceInDays } from 'date-fns'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            group: {
              include: {
                contributionCycles: {
                  where: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = new Date()
    const endOfThisMonth = endOfMonth(now)

    const upcomingPayments = user.memberships.flatMap(membership => {
      const group = membership.group
      const activeCycle = group.contributionCycles[0]

      if (!activeCycle) return []

      // Assuming a simple monthly contribution for now.
      // More complex logic would be needed for different frequencies.
      const dueDate = new Date(now.getFullYear(), now.getMonth(), group.contributionDay)
      
      // If due date for this month has already passed, consider next month's
      if (now > dueDate) {
        dueDate.setMonth(dueDate.getMonth() + 1)
      }

      const daysLeft = differenceInDays(dueDate, now)

      // Only include payments due within the next 30-ish days
      if (daysLeft >= 0 && daysLeft <= 31) {
        return {
          id: `${group.id}-${activeCycle.id}`,
          group: {
            id: group.id,
            name: group.name,
          },
          amount: group.contributionAmount,
          dueDate: dueDate.toISOString(),
          daysLeft: daysLeft,
        }
      }
      return []
    }).sort((a, b) => a.daysLeft - b.daysLeft)


    return NextResponse.json(upcomingPayments)
  } catch (error) {
    console.error("Error fetching upcoming payments:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
