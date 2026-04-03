import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../[...nextauth]/route"
import { getUserGroupRole } from "@/lib/rbac"
import { Permission } from "@/types/roles"

/**
 * GET /api/auth/role?groupId=xxx
 * Returns user's role in a specific group
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const groupId = req.nextUrl.searchParams.get("groupId")

    if (!groupId) {
      return NextResponse.json(
        { error: "groupId parameter is required" },
        { status: 400 }
      )
    }

    const role = await getUserGroupRole(session.user.id, groupId)

    return NextResponse.json({ role })
  } catch (error) {
    console.error("Error fetching user role:", error)
    return NextResponse.json(
      { error: "Failed to fetch user role" },
      { status: 500 }
    )
  }
}
