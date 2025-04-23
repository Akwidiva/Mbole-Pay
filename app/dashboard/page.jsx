import { Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments"
import { DisputeResolution } from "@/components/dashboard/dispute-resolution"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Manage your savings groups and track your contributions." />
      <Suspense fallback={<DashboardSkeleton />}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardOverview />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          <div className="col-span-2">
            <RecentTransactions />
          </div>
          <div className="space-y-4">
            <UpcomingPayments />
            <DisputeResolution />
          </div>
        </div>
        <div className="mt-4">
          <QuickActions />
        </div>
      </Suspense>
    </DashboardShell>
  )
}
