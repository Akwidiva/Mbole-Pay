import Link from "next/link"
import prisma from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function AdminUserPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return (
      <div className="p-6">
        <p>Unauthorized</p>
      </div>
    )
  }

  const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!adminUser || !["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
    return (
      <div className="p-6">
        <p>Forbidden</p>
      </div>
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { memberships: { include: { group: true } } },
  })

  if (!user) {
    return (
      <div className="p-6">
        <p>User not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">User Details</h1>
        <Link href="/admin/users">
          <Button variant="ghost">Back</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user.name || user.email}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Email: {user.email}</p>
          <p className="text-sm text-muted-foreground">Role: {user.role}</p>

          <div className="mt-4">
            <h3 className="font-semibold">Memberships</h3>
            <ul className="mt-2 space-y-2">
              {user.memberships.map((m) => (
                <li key={m.id}>
                  <Link href={`/groups/${m.group.id}`}>{m.group.name}</Link> — {m.role}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
