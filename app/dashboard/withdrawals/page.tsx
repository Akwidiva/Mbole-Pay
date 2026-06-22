import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import WithdrawalHistory from "@/components/withdraw/WithdrawalHistory"

export default async function WithdrawalsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/signin")
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { role: true } })
  const isAdmin = user?.role === "ADMIN"

  return (
    <DashboardShell>
      <DashboardHeader heading="Withdrawal Requests" text="View withdrawal requests and manage payouts (admins only)." />
      <div className="mt-4">
        <WithdrawalHistory admin={isAdmin} />
      </div>
    </DashboardShell>
  )
}
