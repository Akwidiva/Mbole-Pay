import { Suspense } from "react"
import { DisputesHeader } from "@/components/disputes/disputes-header"
import { DisputesList } from "@/components/disputes/disputes-list"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function DisputesPage() {
  return (
    <DashboardShell>
      <DisputesHeader heading="Disputes" text="Manage and vote on active disputes within your groups." />
      <Suspense fallback={<DashboardSkeleton />}>
        <DisputesList />
      </Suspense>
    </DashboardShell>
  )
}
