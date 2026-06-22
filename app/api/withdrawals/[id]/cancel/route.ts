import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 })
    }

    const actor = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } })
    if (!actor) return NextResponse.json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } }, { status: 404 })

    if (actor.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Requires administrative privileges" } }, { status: 403 })
    }

    const id = params.id
    const existing = await prisma.withdrawalRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Withdrawal request not found" } }, { status: 404 })
    }

    const updated = await prisma.withdrawalRequest.update({ where: { id }, data: { status: "CANCELLED" } })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error("Cancel withdrawal error:", error)
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to cancel withdrawal", details: process.env.NODE_ENV === "development" ? error.message : undefined } }, { status: 500 })
  }
}
