import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import InviteMembersPage from "@/components/groups/invite-members-page"

export default async function InvitePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/signin")
  }

  return (
    <DashboardShell>
      <InviteMembersPage />
    </DashboardShell>
  )
}
