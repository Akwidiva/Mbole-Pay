"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { AlertTriangle, Clock, XCircle, Upload } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export function KycPendingBanner() {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id
  const kycStatus = (session?.user as any)?.kycStatus

  useEffect(() => {
    if (!userId || kycStatus !== "APPROVED") return
    const key = `kyc_approved_toast_${userId}`
    if (!localStorage.getItem(key)) {
      toast.success("Identity verified! All features are now unlocked.", {
        description: "Your account has been approved. Welcome to Mbole Pay!",
        duration: 6000,
      })
      localStorage.setItem(key, "1")
    }
  }, [userId, kycStatus])

  if (!kycStatus || kycStatus === "APPROVED") return null

  if (kycStatus === "PENDING") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <span className="font-semibold text-amber-800">Account under review — financial features locked.</span>
          <span className="ml-1 text-amber-700">
            Your identity documents are being reviewed. You can browse the app but cannot create groups, join groups, or make payments until approved.
          </span>
        </div>
      </div>
    )
  }

  if (kycStatus === "REJECTED") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        <div>
          <span className="font-semibold text-red-800">Identity verification rejected.</span>
          <span className="ml-1 text-red-700">
            Please resubmit your documents.{" "}
          </span>
          <Link href="/kyc" className="font-semibold text-red-800 underline underline-offset-2">
            Resubmit now
          </Link>
        </div>
      </div>
    )
  }

  // kycStatus === "NONE" — user hasn't submitted yet
  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
      <div>
        <span className="font-semibold text-blue-800">Identity verification required.</span>
        <span className="ml-1 text-blue-700">
          Upload your National ID and a selfie to unlock group creation, joining, and payments.{" "}
        </span>
        <Link href="/kyc" className="font-semibold text-blue-800 underline underline-offset-2 inline-flex items-center gap-1">
          <Upload className="h-3 w-3" />
          Verify now
        </Link>
      </div>
    </div>
  )
}
