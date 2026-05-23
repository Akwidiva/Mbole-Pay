import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CreateGroupPage } from "@/components/groups/create-group-page"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function NewGroupPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/signin')

  return (
    <DashboardShell>
      <CreateGroupPage />
    </DashboardShell>
  )
}
