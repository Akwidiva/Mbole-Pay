"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Upload, CreditCard, Camera, CheckCircle2, Loader2 } from "lucide-react"

interface KycUploadProps {
  onSuccess: () => void
  className?: string
}

interface FileState {
  file: File | null
  preview: string | null
}

export function KycUpload({ onSuccess, className }: KycUploadProps) {
  const [idDoc, setIdDoc] = useState<FileState>({ file: null, preview: null })
  const [selfie, setSelfie] = useState<FileState>({ file: null, preview: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileState>>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB")
      return
    }

    const allowedExts = ["jpg", "jpeg", "png", "webp", "heic", "heif"]
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
    if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
      setError("Only JPG, PNG, WEBP, or HEIC images are accepted")
      return
    }

    const reader = new FileReader()
    reader.onload = () => setter({ file, preview: reader.result as string })
    reader.readAsDataURL(file)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!idDoc.file || !selfie.file) {
      setError("Please upload both your National ID and a selfie photo")
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append("idDocument", idDoc.file)
      form.append("selfiePhoto", selfie.file)

      const res = await fetch("/api/kyc/submit", { method: "POST", body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Upload failed")

      toast.success("Documents submitted! We'll review them shortly.")
      onSuccess()
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("space-y-6", className)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Verify your identity</h3>
        <p className="text-sm text-muted-foreground">
          Upload your National ID and a clear selfie. Documents are stored securely on IPFS and never shared.
        </p>
      </div>

      {error && (
        <div className="rounded bg-red-100 p-3 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* National ID upload */}
        <div
          onClick={() => idInputRef.current?.click()}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 transition-colors",
            idDoc.preview
              ? "border-primary/40 bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/50"
          )}
        >
          <input
            ref={idInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
            className="hidden"
            onChange={(e) => handleFile(e, setIdDoc)}
            disabled={loading}
          />
          {idDoc.preview ? (
            <div className="flex w-full items-center gap-3">
              <img src={idDoc.preview} alt="ID preview" className="h-16 w-24 rounded-lg object-cover" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{idDoc.file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {((idDoc.file?.size || 0) / 1024).toFixed(0)} KB
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            </div>
          ) : (
            <>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">National ID (CNI)</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP · max 5 MB</p>
              </div>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </div>

        {/* Selfie upload */}
        <div
          onClick={() => selfieInputRef.current?.click()}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 transition-colors",
            selfie.preview
              ? "border-primary/40 bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/50"
          )}
        >
          <input
            ref={selfieInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
            className="hidden"
            onChange={(e) => handleFile(e, setSelfie)}
            disabled={loading}
          />
          {selfie.preview ? (
            <div className="flex w-full items-center gap-3">
              <img src={selfie.preview} alt="Selfie preview" className="h-16 w-16 rounded-full object-cover" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{selfie.file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {((selfie.file?.size || 0) / 1024).toFixed(0)} KB
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
            </div>
          ) : (
            <>
              <Camera className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Photo of yourself</p>
                <p className="text-xs text-muted-foreground">Clear face photo · max 5 MB</p>
              </div>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Make sure your ID is clearly readable and your face is visible in the selfie
        </p>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !idDoc.file || !selfie.file}
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
          ) : (
            "Submit for Verification"
          )}
        </Button>
      </form>
    </motion.div>
  )
}
