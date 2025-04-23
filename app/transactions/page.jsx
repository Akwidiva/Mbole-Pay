import { Suspense } from "react"
import { TransactionsHeader } from "@/components/transactions/transactions-header"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { TransactionsFilter } from "@/components/transactions/transactions-filter"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function TransactionsPage() {
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
