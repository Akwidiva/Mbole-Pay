import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user?.mfaOtp || !user?.mfaOtpExpiry) {
      return NextResponse.json(
        { error: "No code found. Please sign in again." },
        { status: 400 }
      )
    }

    if (new Date() > user.mfaOtpExpiry) {
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaOtp: null, mfaOtpExpiry: null },
      })
      return NextResponse.json(
        { error: "Code expired. Please sign in again." },
        { status: 400 }
      )
    }

    if (user.mfaOtp !== code.trim()) {
      return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 })
    }

    // Clear OTP — single use
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaOtp: null, mfaOtpExpiry: null },
    })

    return NextResponse.json({ verified: true })
  } catch (error) {
    console.error("[mfa/verify]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
