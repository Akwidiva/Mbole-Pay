import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import prisma from "@/lib/db"
import { emailService } from "@/lib/services/email-service"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user?.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (user.suspended) {
      return NextResponse.json({ error: "This account has been suspended. Contact support for assistance." }, { status: 403 })
    }

    const privilegedMembership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        role: "ADMIN",
      },
    })

    if (!privilegedMembership) {
      return NextResponse.json({ mfaRequired: false })
    }

    // Generate 6-digit OTP and store with 5-minute expiry
    const otp = crypto.randomInt(100000, 999999).toString()
    const expiry = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { mfaOtp: otp, mfaOtpExpiry: expiry },
    })

    await emailService.sendMfaOtp(email, { otp, userName: user.name || "there" })

    return NextResponse.json({ mfaRequired: true })
  } catch (error) {
    console.error("[mfa/initiate]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
