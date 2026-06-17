import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"

// GET /api/user/profile
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, phone: true, image: true, kycStatus: true, createdAt: true },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json({ data: user })
}

// PATCH /api/user/profile
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, phone } = body

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  if (phone) {
    const phoneRegex = /^(\+237)?[679]\d{8}$/
    if (!phoneRegex.test(String(phone).replace(/\s/g, ""))) {
      return NextResponse.json({ error: "Enter a valid Cameroon mobile number (e.g. +237 6XX XXX XXX)" }, { status: 400 })
    }
  }

  const updated = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      name: name.trim(),
      ...(phone ? { phone: String(phone).replace(/\s/g, "") } : {}),
    },
    select: { id: true, name: true, email: true, phone: true, image: true, kycStatus: true },
  })

  return NextResponse.json({ data: updated, message: "Profile updated" })
}
