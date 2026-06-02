import { useCallback, useState } from "react"
import { toast } from "sonner"
import {
  createWithdrawalPreview,
  validateWithdrawalFields,
  type WithdrawFormValues,
} from "@/lib/withdraw-validation"
import type { WithdrawalPreview, WithdrawalValidationErrors, WithdrawalRequestResponse } from "@/types/withdraw"

interface UseWithdrawOptions {
  onDial?: (preview: WithdrawalPreview) => void
  onError?: (message: string) => void
  onPrepare?: (preview: WithdrawalPreview) => void
}

export function useWithdraw(options: UseWithdrawOptions = {}) {
  const [preview, setPreview] = useState<WithdrawalPreview | null>(null)
  const [errors, setErrors] = useState<WithdrawalValidationErrors>({})
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDialing, setIsDialing] = useState(false)

  const prepareWithdrawal = useCallback(
    (values: WithdrawFormValues) => {
      const result = validateWithdrawalFields(values)

      if (!result.valid || !result.preview) {
        setErrors(result.errors)
        const message = result.errors.phoneNumber || result.errors.amount || "Please review the form"
        toast.error(message)
        options.onError?.(message)
        return null
      }

      setErrors({})
      setPreview(result.preview)
      setIsConfirmOpen(true)
      options.onPrepare?.(result.preview)
      return result.preview
    },
    [options]
  )

  const confirmWithdrawal = useCallback(async () => {
    if (!preview) {
      toast.error("Create a withdrawal preview first")
      return false
    }

    try {
      setIsDialing(true)
      if (typeof window === "undefined") {
        throw new Error("Dialer can only be opened in the browser")
      }

      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: preview.phoneNumber,
          amount: preview.amount,
        }),
      })

      const data: WithdrawalRequestResponse = await response.json()

      if (!response.ok || !data.success || !data.data) {
        const message = data.error?.message || "Failed to save withdrawal request"
        throw new Error(message)
      }

      toast.success("Opening MTN dialer")
      options.onDial?.(preview)
      window.location.href = preview.dialerUrl
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to open dialer"
      toast.error(message)
      options.onError?.(message)
      return false
    } finally {
      setIsDialing(false)
      setIsConfirmOpen(false)
    }
  }, [options, preview])

  const cancelWithdrawal = useCallback(() => {
    setIsConfirmOpen(false)
  }, [])

  const resetWithdrawal = useCallback(() => {
    setPreview(null)
    setErrors({})
    setIsConfirmOpen(false)
    setIsDialing(false)
  }, [])

  return {
    preview,
    errors,
    isConfirmOpen,
    isDialing,
    prepareWithdrawal,
    confirmWithdrawal,
    cancelWithdrawal,
    resetWithdrawal,
    setPreview,
  }
}
