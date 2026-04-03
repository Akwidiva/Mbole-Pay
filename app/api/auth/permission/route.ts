import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../[...nextauth]/route"
import { userHasPermission } from "@/lib/rbac"
import { Permission } from "@/types/roles"

/**
 * GET /api/auth/permission?groupId=xxx&permission=yyy
 * Returns whether user has specific permission in a group
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const groupId = req.nextUrl.searchParams.get("groupId")
    const permission = req.nextUrl.searchParams.get("permission") as Permission

    if (!groupId || !permission) {
      return NextResponse.json(
        { error: "groupId and permission parameters are required" },
        { status: 400 }
      )
    }

    const hasPermission = await userHasPermission(
      session.user.id,
      groupId,
      permission
    )

    return NextResponse.json({ hasPermission })
  } catch (error) {
    console.error("Error checking permission:", error)
    return NextResponse.json(
      { error: "Failed to check permission" },
      { status: 500 }
    )
  }
}
