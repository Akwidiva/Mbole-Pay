// app/api/groups/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      memberships: { include: { user: true } },
      transactions: true,
      disputes: true,
    },
  })
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(group)
}