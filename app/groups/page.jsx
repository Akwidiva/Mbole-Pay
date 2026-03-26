import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { GroupsList } from "@/components/groups/groups-list"
import { GroupsHeader } from "@/components/groups/groups-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default async function GroupsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/signin")
  return (
    <DashboardShell>
      <GroupsHeader heading="Savings Groups" text="Manage your active and pending savings groups." />
      <Suspense fallback={<DashboardSkeleton />}>
        <GroupsList />
      </Suspense>
    </DashboardShell>
  )
}
