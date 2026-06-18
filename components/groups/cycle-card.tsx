"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, Clock, Phone, Smartphone, AlertCircle, Play, RefreshCw, Gift } from "lucide-react"

interface Contribution {
  id: string
  userId: string
  userName: string | null
  userEmail: string
  amount: number
  status: "PENDING" | "PAID" | "OVERDUE"
  paidAt: string | null
}

interface Recipient {
  id: string
  name: string | null
  email: string
  phone: string | null
}

interface CycleData {
  currentCycle: number
  recipient: Recipient | null
  contributions: Contribution[]
  myContribution: { id: string; status: string; amount: number } | null
  cycleStarted: boolean
  paidCount: number
  totalCount: number
  totalPool: number
  payoutTriggered: boolean
  payoutStatus: string | null
  isAdmin: boolean
  isRecipient: boolean
  myPhone: string | null
}

interface CycleCardProps {
  groupId: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(n)

export function CycleCard({ groupId }: CycleCardProps) {
  const { toast } = useToast()
  const [data, setData] = useState<CycleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [starting, setStarting] = useState(false)

  const fetchCycle = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/cycle`)
      if (!res.ok) return
      const json = await res.json()
      setData(json.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => { fetchCycle() }, [fetchCycle])

  const startCycle = async () => {
    setStarting(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/cycle`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        toast({ title: "Error", description: json.error, variant: "destructive" })
        return
      }
      toast({ title: `Cycle ${json.data.cycle} started`, description: `${json.data.memberCount} members notified` })
      await fetchCycle()
    } finally {
      setStarting(false)
    }
  }

  const payNow = async () => {
    if (!data?.myContribution) return
    if (!data.myPhone) {
      toast({
        title: "Phone number missing",
        description: "Add your phone number in profile settings to use one-tap payment.",
        variant: "destructive",
      })
      return
    }

    setPaying(true)
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          contributionId: data.myContribution.id,
          phoneNumber: data.myPhone,
          provider: "FAPSHI",
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        toast({ title: "Payment failed", description: json.error?.message || "Could not initiate payment", variant: "destructive" })
        return
      }

      // Hosted checkout flow — redirect to Fapshi's payment page
      if (json.data?.redirectUrl) {
        toast({ title: "Redirecting to payment...", description: "Complete your payment on Fapshi's secure page." })
        window.open(json.data.redirectUrl, "_blank")
        // Poll for confirmation after redirect
        let attempts = 0
        const poll = setInterval(async () => {
          attempts++
          await fetchCycle()
          if (attempts >= 36) clearInterval(poll) // poll 3 min
        }, 5000)
        return
      }

      // USSD direct-pay flow (once Direct Pay is approved)
      toast({
        title: "Check your phone!",
        description: `A payment prompt was sent to ${data.myPhone}. Enter your 5-digit MTN MoMo PIN to confirm.`,
      })

      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        await fetchCycle()
        if (attempts >= 24) clearInterval(poll)
      }, 5000)

    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const progressPct = data.totalCount > 0 ? (data.paidCount / data.totalCount) * 100 : 0
  const myPaid = data.myContribution?.status === "PAID"

  return (
    <Card className="rounded-2xl shadow-sm border-2 border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Cycle {data.currentCycle}
              {data.payoutTriggered && (
                <Badge variant="default" className="bg-green-600">Payout Sent</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {data.cycleStarted
                ? `${data.paidCount} of ${data.totalCount} members paid`
                : "Cycle not started yet"}
            </CardDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={fetchCycle}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Recipient */}
        {data.recipient && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              {(data.recipient.name || data.recipient.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">This cycle's recipient</p>
              <p className="font-semibold">{data.recipient.name || data.recipient.email}</p>
              <p className="text-xs text-muted-foreground">{data.recipient.phone || "No phone saved"}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Total pool</p>
              <p className="font-bold text-emerald-700 dark:text-emerald-400">{fmt(data.totalPool)}</p>
            </div>
          </div>
        )}

        {/* Pay Now button — the main action */}
        {data.cycleStarted && !data.payoutTriggered && (
          <div className="space-y-2">
            {myPaid ? (
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${data.isRecipient ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"}`}>
                {data.isRecipient ? <Gift className="h-5 w-5 text-purple-600 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                <div>
                  <p className={`font-semibold ${data.isRecipient ? "text-purple-700 dark:text-purple-400" : "text-green-700 dark:text-green-400"}`}>
                    {data.isRecipient ? "You're this cycle's recipient — contribution auto-confirmed" : "Your contribution is confirmed"}
                  </p>
                  <p className="text-xs text-muted-foreground">{fmt(data.myContribution!.amount)} {data.isRecipient ? "offset against your payout" : "paid"}</p>
                </div>
              </div>
            ) : data.myContribution ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>Your contribution of <strong>{fmt(data.myContribution.amount)}</strong> is pending</span>
                </div>

                <Button
                  type="button"
                  className="w-full h-14 text-base font-semibold gap-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700"
                  onClick={payNow}
                  disabled={paying}
                >
                  {paying ? (
                    <>
                      <Smartphone className="h-5 w-5 animate-pulse" />
                      Sending to your phone...
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5" />
                      Pay Now — {fmt(data.myContribution.amount)}
                      {data.myPhone && (
                        <span className="text-xs opacity-75 font-normal">via {data.myPhone}</span>
                      )}
                    </>
                  )}
                </Button>
                {!data.myPhone && (
                  <p className="text-xs text-amber-600 text-center">
                    Add your phone number in profile to enable one-tap payment
                  </p>
                )}
                {paying && (
                  <p className="text-xs text-center text-muted-foreground">
                    Check your phone for the MTN MoMo prompt. Enter your 5-digit PIN to confirm.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Payout complete banner */}
        {data.payoutTriggered && data.payoutStatus === "COMPLETED" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {fmt(data.totalPool)} was sent to {data.recipient?.name || "the recipient"} — cycle complete!
            </p>
          </div>
        )}

        {/* Progress bar */}
        {data.cycleStarted && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Collection progress</span>
              <span>{data.paidCount}/{data.totalCount} paid</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        )}

        {/* Member list */}
        {data.cycleStarted && data.contributions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member payments</p>
            {data.contributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                <div className="flex items-center gap-2">
                  {c.status === "PAID" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                  )}
                  <span className={c.status === "PAID" ? "text-foreground" : "text-muted-foreground"}>
                    {c.userName || c.userEmail}
                  </span>
                </div>
                <Badge variant={c.status === "PAID" ? "default" : "secondary"} className="text-xs">
                  {c.status === "PAID" ? `Paid ${fmt(c.amount)}` : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Admin: start cycle button only for the very first cycle.
            After cycle 1 completes, all subsequent cycles auto-start after payout. */}
        {data.isAdmin && !data.cycleStarted && data.currentCycle === 1 && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={startCycle}
            disabled={starting}
          >
            {starting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {starting ? "Starting cycle..." : `Start Cycle ${data.currentCycle}`}
          </Button>
        )}

        {/* Subsequent cycles auto-start after payout — show a waiting state if
            the cycle number advanced but contributions haven't appeared yet */}
        {!data.cycleStarted && data.currentCycle > 1 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Next cycle starting automatically after payout settles…</span>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
