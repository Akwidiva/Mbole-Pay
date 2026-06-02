"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle2, Loader2, PhoneCall, Smartphone, ShieldCheck, Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { containerVariants, itemVariants } from "@/lib/animations"
import { useIsMobile } from "@/hooks/use-mobile"
import { useWithdraw } from "@/hooks/useWithdraw"
import {
  buildMtnWithdrawalUssd,
  createWithdrawalPreview,
  withdrawFormSchema,
  type WithdrawFormValues,
} from "@/lib/withdraw-validation"

interface WithdrawFormProps {
  initialPhoneNumber?: string
  defaultAmount?: number
}

export function WithdrawForm({ initialPhoneNumber = "", defaultAmount = 0 }: WithdrawFormProps) {
  const isMobile = useIsMobile()
  const {
    preview,
    errors,
    isConfirmOpen,
    isDialing,
    prepareWithdrawal,
    confirmWithdrawal,
    cancelWithdrawal,
    resetWithdrawal,
  } = useWithdraw()

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      phoneNumber: initialPhoneNumber,
      amount: defaultAmount,
    },
  })

  useEffect(() => {
    if (initialPhoneNumber) {
      form.setValue("phoneNumber", initialPhoneNumber, {
        shouldValidate: true,
        shouldDirty: false,
      })
    }
  }, [form, initialPhoneNumber])

  const watchedPhoneNumber = form.watch("phoneNumber")
  const watchedAmount = form.watch("amount")

  const livePreview = useMemo(() => {
    try {
      if (!watchedPhoneNumber || !watchedAmount || Number(watchedAmount) <= 0) {
        return null
      }

      return createWithdrawalPreview(watchedPhoneNumber, watchedAmount)
    } catch {
      return null
    }
  }, [watchedAmount, watchedPhoneNumber])

  const onSubmit = (values: WithdrawFormValues) => {
    prepareWithdrawal(values)
  }

  const displayPreview = preview || livePreview

  return (
    <>
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6">
        <Card className="overflow-hidden border-none shadow-2xl shadow-black/5 dark:shadow-black/30">
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-6 py-8 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <Badge className="mb-2 bg-white/15 text-white hover:bg-white/20">MTN Mobile Money</Badge>
                <h1 className="text-3xl font-bold tracking-tight">Withdraw cash</h1>
                <p className="mt-2 max-w-xl text-sm text-white/80">
                  Generate an MTN MoMo USSD command, open your dialer, and confirm the transaction on your phone.
                </p>
              </div>
            </div>
          </div>

          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <motion.div variants={itemVariants} className="space-y-4">
                <Card className="border-emerald-100 bg-emerald-50/60 shadow-none dark:border-emerald-900/40 dark:bg-emerald-950/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Smartphone className="h-5 w-5 text-emerald-600" />
                      Withdrawal form
                    </CardTitle>
                    <CardDescription>Enter your MTN MoMo number and the amount to withdraw.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {errors.general && (
                          <Alert variant="destructive">
                            <AlertDescription>{errors.general}</AlertDescription>
                          </Alert>
                        )}

                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>MTN Mobile Money Number</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  inputMode="tel"
                                  placeholder="+237691234567"
                                  disabled={isDialing}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                Cameroon MTN number starting with 6, 7, or 9.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Withdrawal Amount</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="5000"
                                  disabled={isDialing}
                                  className="h-12 rounded-xl"
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                Enter a whole number in XAF.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-4 text-sm text-slate-700 dark:border-emerald-900/40 dark:bg-slate-950/50 dark:text-slate-200">
                          <div className="mb-2 flex items-center gap-2 font-medium">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Security first
                          </div>
                          <p>No PIN is stored, auto-filled, or bypassed. You confirm the transaction on your phone yourself.</p>
                        </div>

                        <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold" disabled={isDialing}>
                          {isDialing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Opening dialer...
                            </>
                          ) : (
                            <>
                              Withdraw Now
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-4">
                <Card className="border-none bg-slate-950 text-white shadow-xl shadow-slate-950/20 dark:bg-slate-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                      <PhoneCall className="h-5 w-5 text-cyan-300" />
                      Transaction summary
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Live preview of the MTN MoMo USSD command.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-300">Phone number</span>
                        <span className="font-mono text-white">{displayPreview?.phoneNumber || "+237..."}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-300">Amount</span>
                        <span className="font-semibold text-white">
                          {displayPreview ? `${displayPreview.amount.toLocaleString()} XAF` : "0 XAF"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-300">USSD</span>
                        <span className="font-mono text-xs text-cyan-200">
                          {displayPreview?.ussd || "*126*1*PHONE*AMOUNT#"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-50">
                      <div className="mb-2 flex items-center gap-2 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        What happens next
                      </div>
                      <p>
                        Your phone dialer opens with the MTN code prefilled. Enter the code, then complete the withdrawal on your phone with your MTN MoMo PIN.
                      </p>
                    </div>

                    {isMobile ? (
                      <p className="text-xs text-slate-400">
                        Optimized for Android browsers and PWA installs.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        This flow is best on Android, where tel: links can jump directly into the phone dialer.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelWithdrawal()
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm withdrawal</DialogTitle>
            <DialogDescription>
              Review the MTN MoMo command before your phone dialer opens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                We never store your PIN. After you open the dialer, you manually finish the transaction on your phone.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 rounded-2xl border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Number</span>
                <span className="font-mono">{preview?.phoneNumber || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{preview?.amount.toLocaleString() || "0"} XAF</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">USSD</span>
                <span className="font-mono text-xs">{preview?.ussd || buildMtnWithdrawalUssd("691234567", 1)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={cancelWithdrawal} disabled={isDialing}>
                Cancel
              </Button>
              <Button onClick={confirmWithdrawal} disabled={isDialing}>
                {isDialing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    Open Dialer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default WithdrawForm
