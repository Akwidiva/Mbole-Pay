"use client"

import { useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useContributions } from "@/hooks/use-contributions"
import { PaymentModal } from "@/components/payments/payment-modal"
import { ArrowRight, CreditCard, Phone, ShieldCheck } from "lucide-react"

type SelectedContribution = {
  id: string
  amount: number
  status: "PENDING" | "PAID" | "OVERDUE"
  dueDate: string
  groupId: string
  group?: { id: string; name: string }
}

interface PaymentsPageProps {
  initialPhoneNumber?: string
}

export function PaymentsPage({ initialPhoneNumber = "" }: PaymentsPageProps) {
  const { data: session } = useSession()
  const { contributions, loading, refetch } = useContributions()
  const [selected, setSelected] = useState<SelectedContribution | null>(null)

  const pendingContributions = useMemo(
    () => contributions.filter((contribution) => contribution.status !== "PAID"),
    [contributions]
  )

  const savedPhoneNumber = session?.user?.phone || initialPhoneNumber || ""

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <CreditCard className="h-8 w-8" />
              Make Payment
            </CardTitle>
            <CardDescription>
              Select a pending contribution, then confirm with your saved mobile money number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Pending contributions</p>
                <p className="text-2xl font-bold">{pendingContributions.length}</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Saved phone</p>
                <p className="text-2xl font-bold">{savedPhoneNumber || "Not set"}</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Payment method</p>
                <p className="text-2xl font-bold">Fapshi</p>
              </div>
            </div>

            {savedPhoneNumber ? (
              <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
                <ShieldCheck className="h-5 w-5" />
                Your saved mobile money number will be prefilled when you open a payment.
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <Phone className="h-5 w-5" />
                No saved phone number found on your profile. You can still enter one during payment.
              </div>
            )}

            {pendingContributions.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                No pending contributions right now.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingContributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{contribution.group?.name || "Unknown Group"}</p>
                        {getStatusBadge(contribution.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Due {new Date(contribution.dueDate).toLocaleDateString()}
                      </p>
                      <p className="text-lg font-bold">{contribution.amount.toLocaleString()} XAF</p>
                    </div>

                    <Button onClick={() => setSelected(contribution)}>
                      Pay Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>Fast payment flow for Njangi contributions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>1. Pick the contribution you want to pay.</p>
            <p>2. Your saved phone number is used automatically when available.</p>
            <p>3. Confirm the mobile money prompt (MTN MoMo or Orange Money) on your phone.</p>
            <p>4. Return here to see the live payment status.</p>

            <div className="rounded-2xl border bg-muted/30 p-4 text-xs">
              If you are the treasurer or admin for a group, use the Group Members tab to change roles and keep
              collection duties organized.
            </div>
          </CardContent>
        </Card>
      </div>

      {selected && (
        <PaymentModal
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) setSelected(null)
          }}
          groupId={selected.groupId}
          contributionId={selected.id}
          amount={selected.amount}
          currency="XAF"
          groupName={selected.group?.name || "Group"}
          defaultPhoneNumber={savedPhoneNumber}
          onPaymentSuccess={async () => {
            setSelected(null)
            await refetch()
          }}
        />
      )}
    </div>
  )
}

export default PaymentsPage
