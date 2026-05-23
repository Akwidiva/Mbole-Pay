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
    // load user memberships and basic group info only
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: {
          include: {
            group: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = new Date()
    const endOfThisMonth = endOfMonth(now)

    // Contribution cycles are not modeled in the current schema; return
    // an empty upcoming payments list to avoid runtime errors.
    // TODO: implement proper upcoming payment calculation when cycles exist.
    return NextResponse.json([])
  } catch (error) {
    console.error("Error fetching upcoming payments:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
