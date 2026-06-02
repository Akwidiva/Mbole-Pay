import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import prisma from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { userHasPermission } from "@/lib/rbac"
import {
  buildMtnWithdrawalUssd,
  createWithdrawalPreview,
  isValidCameroonMtnNumber,
  normalizeCameroonMtnNumber,
  normalizeWithdrawalAmount,
} from "@/lib/withdraw-validation"
import type { WithdrawalRequestResponse } from "@/types/withdraw"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json<WithdrawalRequestResponse>(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, phone: true },
    })

    if (!user) {
      return NextResponse.json<WithdrawalRequestResponse>(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const phoneNumber = String(body.phoneNumber || "").trim()
    const amount = normalizeWithdrawalAmount(body.amount)

    if (!phoneNumber || !amount) {
      return NextResponse.json<WithdrawalRequestResponse>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Phone number and amount are required",
          },
        },
        { status: 400 }
      )
    }

    if (!isValidCameroonMtnNumber(phoneNumber)) {
      return NextResponse.json<WithdrawalRequestResponse>(
        {
          success: false,
          error: {
            code: "INVALID_PHONE",
            message: "Enter a valid MTN MoMo number",
          },
        },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json<WithdrawalRequestResponse>(
        {
          success: false,
          error: {
            code: "INVALID_AMOUNT",
            message: "Amount must be greater than 0",
          },
        },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizeCameroonMtnNumber(phoneNumber)
    const preview = createWithdrawalPreview(normalizedPhone, amount)

    const targetGroupId = body.groupId || null
    if (targetGroupId) {
      const hasPermission = await userHasPermission(user.id, targetGroupId, "payments:create")
      if (!hasPermission) {
        return NextResponse.json<WithdrawalRequestResponse>(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission to create withdrawal requests in this group",
            },
          },
          { status: 403 }
        )
      }
    }

    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: user.id,
        phoneNumber: preview.phoneNumber,
        amount: preview.amount,
        ussd: preview.ussd,
        dialerUrl: preview.dialerUrl,
        provider: "MTN_MOMO",
        status: "PENDING",
      },
    })

    return NextResponse.json<WithdrawalRequestResponse>(
      {
        success: true,
        data: {
          withdrawalRequest: {
            id: withdrawalRequest.id,
            phoneNumber: withdrawalRequest.phoneNumber,
            amount: withdrawalRequest.amount,
            ussd: withdrawalRequest.ussd,
            dialerUrl: withdrawalRequest.dialerUrl,
            provider: "MTN_MOMO",
            status: "PENDING",
            createdAt: withdrawalRequest.createdAt.toISOString(),
            updatedAt: withdrawalRequest.updatedAt.toISOString(),
          },
          preview,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create withdrawal request error:", error)
    return NextResponse.json<WithdrawalRequestResponse>(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Failed to create withdrawal request",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "User not authenticated" } }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } })
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } }, { status: 404 })
    }

    const url = new URL(request.url)
    const q = url.searchParams
    const emailFilter = q.get("email")
    const userIdFilter = q.get("userId")
    const status = q.get("status")
    const take = Number(q.get("take") || 50)
    const skip = Number(q.get("skip") || 0)

    // Admins (SUPER_ADMIN, ADMIN) can view all records. Others only their own.
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN"

    let targetUserId: string | null = null
    if (emailFilter) {
      const u = await prisma.user.findUnique({ where: { email: emailFilter }, select: { id: true } })
      targetUserId = u?.id ?? null
    } else if (userIdFilter) {
      targetUserId = userIdFilter
    }

    const where: any = {}
    if (status) where.status = status

    if (isAdmin) {
      if (targetUserId) where.userId = targetUserId
    } else {
      // regular users only see their own
      where.userId = user.id
    }

    const records = await prisma.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      include: { user: { select: { id: true, email: true, name: true } } },
    })

    return NextResponse.json({ success: true, data: records })
  } catch (error: any) {
    console.error("Fetch withdrawal requests error:", error)
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Failed to fetch withdrawal requests", details: process.env.NODE_ENV === "development" ? error.message : undefined } }, { status: 500 })
  }
}
