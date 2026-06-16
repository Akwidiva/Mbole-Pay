import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { uploadToIPFS } from "@/lib/services/pinata"

export async function POST(req: NextRequest) {
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

    if (user.kycStatus === "APPROVED") {
      return NextResponse.json({ error: "Already verified" }, { status: 400 })
    }

    const formData = await req.formData()
    const idFile = formData.get("idDocument") as File | null
    const selfieFile = formData.get("selfiePhoto") as File | null

    if (!idFile || !selfieFile) {
      return NextResponse.json(
        { error: "Both National ID and selfie photo are required" },
        { status: 400 }
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5 MB
    if (idFile.size > maxSize || selfieFile.size > maxSize) {
      return NextResponse.json(
        { error: "Each file must be under 5 MB" },
        { status: 400 }
      )
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]
    const isAllowed = (f: File) => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase()
      return allowedTypes.includes(f.type) || allowedExts.includes(ext)
    }
    if (!isAllowed(idFile) || !isAllowed(selfieFile)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, or HEIC images are accepted" },
        { status: 400 }
      )
    }

    // Upload both files to IPFS in parallel, routed to separate Pinata groups
    const idBuffer = Buffer.from(await idFile.arrayBuffer())
    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer())

    const userMeta = {
      userId: user.id,
      userName: user.name ?? "",
      userEmail: user.email,
    }

    const ext = (f: File) => f.name.split(".").pop() ?? "jpg"

    const [idCid, selfieCid] = await Promise.all([
      uploadToIPFS(
        idBuffer,
        `id_${user.name?.replace(/\s+/g, "_") ?? user.id}_${user.email}.${ext(idFile)}`,
        {
          groupId: process.env.PINATA_GROUP_ID_NATIONAL_IDS,
          metadata: userMeta,
        }
      ),
      uploadToIPFS(
        selfieBuffer,
        `selfie_${user.name?.replace(/\s+/g, "_") ?? user.id}_${user.email}.${ext(selfieFile)}`,
        {
          groupId: process.env.PINATA_GROUP_ID_SELFIES,
          metadata: userMeta,
        }
      ),
    ])

    const selfieUrl = `${process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs"}/${selfieCid}`

    await prisma.user.update({
      where: { id: user.id },
      data: {
        kycStatus: "PENDING",
        idDocumentCid: idCid,
        selfiePhotoCid: selfieCid,
        image: selfieUrl,
        kycSubmittedAt: new Date(),
        kycRejectionReason: null,
      },
    })

    return NextResponse.json({ submitted: true, idCid, selfieCid })
  } catch (error) {
    console.error("[kyc/submit]", error)
    return NextResponse.json({ error: "Failed to submit documents" }, { status: 500 })
  }
}
