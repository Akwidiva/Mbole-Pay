import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { WithdrawForm } from "@/components/withdraw"

export default async function WithdrawPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/signin")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { phone: true },
  })

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Withdraw Cash"
        text="Open MTN Mobile Money with a prefilled USSD command and confirm the transfer on your phone."
      />
      <WithdrawForm initialPhoneNumber={user?.phone || session.user.phone || ""} />
    </DashboardShell>
  )
}
