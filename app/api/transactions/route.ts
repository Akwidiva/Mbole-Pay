import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const [payments, payouts] = await Promise.all([
      prisma.payment.findMany({
        where: { userId: user.id, status: { in: ["COMPLETED", "PENDING", "PROCESSING", "FAILED"] } },
        include: { group: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.payout.findMany({
        where: { recipientId: user.id },
        include: { group: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ])

    const contributions = payments
      .filter((p) => !p.providerRef?.startsWith("recipient-offset-"))
      .map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        group: { id: p.group?.id ?? null, name: p.group?.name ?? "Unknown", imageUrl: null },
        type: "contribution",
        amount: p.amount,
        status: p.status.toLowerCase(),
        reference: p.providerRef ?? p.id.slice(0, 8).toUpperCase(),
      }))

    const payoutTxns = payouts.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      group: { id: p.group?.id ?? null, name: p.group?.name ?? "Unknown", imageUrl: null },
      type: "payout",
      amount: p.amount,
      status: p.status.toLowerCase(),
      reference: p.providerRef ?? `PAYOUT-${p.cycle}`,
    }))

    const all = [...contributions, ...payoutTxns].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json(all)
  } catch (error: any) {
    console.error("[transactions] error:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
