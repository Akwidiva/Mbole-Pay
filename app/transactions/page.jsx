import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { TransactionsHeader } from "@/components/transactions/transactions-header"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { TransactionsFilter } from "@/components/transactions/transactions-filter"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/signin")
  return (
    <DashboardShell>
      <TransactionsHeader heading="Transactions" text="View and manage all your financial activities." />
      <Suspense fallback={<DashboardSkeleton />}>
        <TransactionsFilter />
        <TransactionsList />
      </Suspense>
    </DashboardShell>
  )
}
