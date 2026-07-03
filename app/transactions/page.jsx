import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { TransactionsPanel } from "@/components/transactions/transactions-panel"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/signin")
  return (
    <DashboardShell>
      <Suspense fallback={<DashboardSkeleton />}>
        <TransactionsPanel />
      </Suspense>
    </DashboardShell>
  )
}
