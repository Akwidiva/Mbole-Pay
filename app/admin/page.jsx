import { Suspense } from "react"
import { AdminOverview } from "@/components/admin/admin-overview"
import { AllUsers } from "@/components/admin/all-users"
import { AllGroups } from "@/components/admin/all-groups"
import { PendingDisputes } from "@/components/admin/pending-disputes"
import { AdminActions } from "@/components/admin/admin-actions"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System administration and oversight</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <AdminOverview />
        
        <div className="grid gap-8 md:grid-cols-2 mt-8">
          <AllUsers />
          <AllGroups />
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 mt-8">
          <PendingDisputes />
          <AdminActions />
        </div>
      </Suspense>
    </div>
  )
}
