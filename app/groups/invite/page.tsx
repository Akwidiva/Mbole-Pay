import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import InviteMembersPage from "@/components/groups/invite-members-page"
import { Skeleton } from "@/components/ui/skeleton"

export default async function InvitePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/signin")
  }

  return (
    <DashboardShell>
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-72 w-full" /></div>}>
        <InviteMembersPage />
      </Suspense>
    </DashboardShell>
  )
}
