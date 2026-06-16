import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import prisma from "@/lib/db"
import { emailService } from "@/lib/services/email-service"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ alreadyVerified: true })
    }

    // Reuse mfaOtp/mfaOtpExpiry fields — signup and MFA login never overlap
    const otp = crypto.randomInt(100000, 999999).toString()
    const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaOtp: otp, mfaOtpExpiry: expiry },
    })

    await emailService.sendEmailVerification(email, {
      otp,
      userName: user.name || "there",
    })

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error("[verify-email/send]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
