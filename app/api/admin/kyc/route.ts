import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const submissions = await prisma.user.findMany({
      where: { kycStatus: { in: ["PENDING", "REJECTED"] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        kycStatus: true,
        idDocumentCid: true,
        selfiePhotoCid: true,
        kycRejectionReason: true,
        kycSubmittedAt: true,
      },
      orderBy: { kycSubmittedAt: "asc" },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("[admin/kyc GET]", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
