import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import PaymentsPage from "@/components/payments/payments-page"

export default async function DashboardPaymentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/signin")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { phone: true },
  })

  return (
    <DashboardShell>
      <PaymentsPage initialPhoneNumber={user?.phone || ""} />
    </DashboardShell>
  )
}
