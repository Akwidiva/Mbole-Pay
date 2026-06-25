import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments"
import { DisputeResolution } from "@/components/dashboard/dispute-resolution"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { RecipientAlert } from "@/components/dashboard/recipient-alert"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/signin")
  
  if (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") {
    redirect("/admin")
  }
  
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Manage your savings groups and track your contributions." />
      <Suspense fallback={<DashboardSkeleton />}>
        <RecipientAlert />
        <DashboardOverview />
        <div className="grid gap-8 md:grid-cols-3 mt-8">
          <div className="md:col-span-2">
            <RecentTransactions />
          </div>
          <div className="md:col-span-1">
            <div className="space-y-4">
              <UpcomingPayments />
              <DisputeResolution />
            </div>
          </div>
        </div>
        <div className="mt-8">
          <QuickActions />
        </div>
      </Suspense>
    </DashboardShell>
  )
}
