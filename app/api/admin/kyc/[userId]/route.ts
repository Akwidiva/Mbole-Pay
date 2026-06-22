import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { emailService } from "@/lib/services/email-service"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { action, reason } = await req.json()

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Action must be approve or reject" }, { status: 400 })
    }

    if (action === "reject" && !reason?.trim()) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED"

    await prisma.user.update({
      where: { id: params.userId },
      data: {
        kycStatus: newStatus,
        kycReviewedAt: new Date(),
        kycRejectionReason: action === "reject" ? reason.trim() : null,
      },
    })

    // Notify user by email
    if (user.email) {
      if (action === "approve") {
        await emailService.sendKycApproved(user.email, { userName: user.name || "there" })
      } else {
        await emailService.sendKycRejected(user.email, {
          userName: user.name || "there",
          reason: reason.trim(),
        })
      }
    }

    return NextResponse.json({ updated: true, kycStatus: newStatus })
  } catch (error) {
    console.error("[admin/kyc PATCH]", error)
    return NextResponse.json({ error: "Failed to update KYC status" }, { status: 500 })
  }
}
