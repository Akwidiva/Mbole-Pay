import { Suspense } from "react"
import { GroupsList } from "@/components/groups/groups-list"
import { GroupsHeader } from "@/components/groups/groups-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function GroupsPage() {
  return (
    <DashboardShell>
      <GroupsHeader heading="Savings Groups" text="Manage your active and pending savings groups." />
      <Suspense fallback={<DashboardSkeleton />}>
        <GroupsList />
      </Suspense>
    </DashboardShell>
  )
}
