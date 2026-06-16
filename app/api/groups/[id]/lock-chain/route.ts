import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { lockGroupRulesOnChain, isBlockchainConfigured } from "@/lib/blockchain/factory"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const actor = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!actor) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: actor.id, groupId } },
  })
  if (membership?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the group admin can lock rules on-chain" }, { status: 403 })
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 })

  if (group.contractTxHash) {
    return NextResponse.json({ error: "Rules already locked on-chain" }, { status: 409 })
  }

  if (!isBlockchainConfigured()) {
    return NextResponse.json({ error: "Blockchain not configured on this server" }, { status: 503 })
  }

  try {
    const result = await lockGroupRulesOnChain({
      dbGroupId:          group.id,
      name:               group.name,
      contributionAmount: group.contributionAmount,
      frequency:          group.frequency,
      payoutOrder:        group.payoutOrder,
      minMembers:         group.minMembers,
      maxMembers:         group.maxMembers ?? null,
    })

    await prisma.group.update({
      where: { id: groupId },
      data:  { contractTxHash: result.txHash, contractGroupId: result.onChainGroupId },
    })

    return NextResponse.json({ txHash: result.txHash, contractGroupId: result.onChainGroupId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Blockchain call failed" }, { status: 500 })
  }
}
