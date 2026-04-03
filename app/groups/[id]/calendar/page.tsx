import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { GroupCalendarView } from "@/components/calendar/group-calendar-view"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface GroupCalendarPageProps {
  params: {
    id: string
  }
}

export default async function GroupCalendarPage({ params }: GroupCalendarPageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/signin")

  // Get user
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) redirect("/signin")

  // Get group
  const group = await prisma.group.findUnique({
    where: { id: params.id },
  })

  if (!group) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold mb-4">Group not found</h1>
          <Link href="/groups">
            <Button>Back to Groups</Button>
          </Link>
        </div>
      </DashboardShell>
    )
  }

  // Verify user is member of group
  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      groupId: params.id,
    },
  })

  if (!membership) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access denied</h1>
          <p className="text-muted-foreground mb-6">You are not a member of this group</p>
          <Link href="/groups">
            <Button>Back to Groups</Button>
          </Link>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/groups`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{group.name} - Calendar</h1>
            <p className="text-muted-foreground">View and manage contribution schedules</p>
          </div>
        </div>

        {/* Calendar */}
        <Suspense fallback={<div className="h-96 bg-muted rounded-lg animate-pulse" />}>
          <GroupCalendarView groupId={params.id} groupName={group.name} />
        </Suspense>
      </div>
    </DashboardShell>
  )
}
