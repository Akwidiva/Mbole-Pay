"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { KycUpload } from "@/components/auth/kyc-upload"
import { MboleLogo } from "@/components/mbole-logo"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function KycPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const kycStatus = (session?.user as any)?.kycStatus

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/signin")
  }, [status, router])

  if (status === "loading") return null

  if (kycStatus === "APPROVED") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h1 className="text-xl font-semibold">Identity already verified</h1>
        <p className="text-sm text-muted-foreground">Your account is fully verified.</p>
        <Button asChild><Link href="/dashboard">Go to Dashboard</Link></Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <MboleLogo />
        </div>
        {kycStatus === "REJECTED" && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <span className="font-semibold">Your previous submission was rejected.</span> Please re-upload clear, valid documents.
          </div>
        )}
        {kycStatus === "PENDING" && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <span className="font-semibold">Documents under review.</span> We'll notify you by email once your verification is complete.
          </div>
        )}
        <KycUpload
          onSuccess={async () => {
            await update()
            router.push("/dashboard")
          }}
        />
      </div>
    </div>
  )
}
