// app/api/groups/route.ts
import { NextResponse, NextRequest } from "next/server"
import prisma from '@/lib/db'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { v4 as uuid } from "uuid"
import { lockGroupRulesOnChain, isBlockchainConfigured } from "@/lib/blockchain/factory"
import { createLogger } from "@/lib/observability/logger"

const logger = createLogger("groups.create")

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const groups = await prisma.group.findMany({
      where: {
        memberships: {
          some: { userId: user.id },
        },
      },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        contributions: {
          where: { userId: user.id },
          select: { id: true, status: true, amount: true, dueDate: true },
        },
        _count: {
          select: { memberships: true, contributions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ groups }, { status: 200 })
  } catch (error) {
    console.error("Get groups error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: "Failed to fetch groups",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if ((user as any).kycStatus !== "APPROVED") {
      return NextResponse.json(
        { error: "Identity verification required. Complete KYC to create groups.", code: "KYC_REQUIRED" },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => null) as {
      name?: string
      description?: string
      contributionAmount?: number
      frequency?: string
      cycleType?: string
      payoutOrder?: string
      minMembers?: number
      maxMembers?: number | null
    } | null

    if (!body?.name || !body?.contributionAmount || !body?.frequency || !body?.cycleType) {
      return NextResponse.json(
        { error: "Name, contribution amount, frequency, and cycle type are required" },
        { status: 400 }
      )
    }

    const minMembers = body.minMembers ?? 2
    const maxMembers = body.maxMembers ?? null

    if (minMembers < 2) {
      return NextResponse.json({ error: "Minimum members must be at least 2" }, { status: 400 })
    }
    if (maxMembers !== null && maxMembers <= minMembers) {
      return NextResponse.json({ error: "Maximum members must be greater than minimum members" }, { status: 400 })
    }

    const validPayoutOrders = ["SEQUENTIAL", "LOTTERY"]
    const payoutOrder = body.payoutOrder && validPayoutOrders.includes(body.payoutOrder)
      ? body.payoutOrder
      : "SEQUENTIAL"

    // Generate unique invite code
    const inviteCode = uuid().split("-")[0].toUpperCase()

    // Create group
    const group = await prisma.group.create({
      data: {
        name: body.name,
        description: body.description,
        contributionAmount: body.contributionAmount,
        frequency: body.frequency,
        cycleType: body.cycleType,
        payoutOrder,
        minMembers,
        maxMembers,
        inviteCode,
        creator_id: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        memberships: true,
      },
    })

    // Lock rules on-chain (non-blocking — DB record is already created)
    let contractTxHash: string | null = null
    let contractGroupId: string | null = null

    if (isBlockchainConfigured()) {
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
        contractTxHash  = result.txHash
        contractGroupId = result.onChainGroupId
        logger.info("Group rules locked on-chain", { groupId: group.id, txHash: result.txHash })

        await prisma.group.update({
          where: { id: group.id },
          data:  { contractTxHash, contractGroupId },
        })
      } catch (chainErr) {
        // Blockchain failure does NOT roll back group creation — log and continue
        logger.error("Failed to lock group rules on-chain", {
          groupId: group.id,
          error:   String(chainErr),
        })
      }
    } else {
      logger.warn("Blockchain not configured — group rules not locked on-chain", { groupId: group.id })
    }

    return NextResponse.json(
      {
        message: "Group created successfully",
        group,
        blockchain: contractTxHash
          ? { txHash: contractTxHash, contractGroupId }
          : null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create group error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        error: "Failed to create group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
