import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password, phone } = await req.json();

    // Validate input
    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: "Email, name, phone, and password are required" },
        { status: 400 }
      );
    }

    const phoneRegex = /^(\+237|\+221)?[679]\d{8}$/;
    if (!phoneRegex.test(String(phone).replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "Enter a valid Cameroon mobile number" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone: String(phone).replace(/\s/g, ""),
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
