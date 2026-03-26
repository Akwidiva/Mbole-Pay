import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = (body?.name ?? "").trim()
    const username = (body?.username ?? "").trim().toLowerCase()
    const email = (body?.email ?? "").trim().toLowerCase()
    const password = body?.password

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "Name, username, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: "Username can only contain lowercase letters, numbers, and underscores" }, { status: 400 })
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } })
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({ 
      data: { 
        name, 
        username,
        email,
        password: hashedPassword
      } 
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("Signup error:", e)
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to sign up" }, { status: 500 })
  }
}


