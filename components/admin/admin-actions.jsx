"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { signOut } from "next-auth/react"

export function AdminActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Link href="/admin/users">
            <Button className="w-full justify-start" variant="outline">
              👥 Manage Users
            </Button>
          </Link>
          <Link href="/admin/groups">
            <Button className="w-full justify-start" variant="outline">
              👫 Manage Groups
            </Button>
          </Link>
          <Link href="/admin/disputes">
            <Button className="w-full justify-start" variant="outline">
              ⚖️ Resolve Disputes
            </Button>
          </Link>
          <Button
            className="w-full justify-start"
            variant="destructive"
            onClick={() => signOut({ callbackUrl: "/signin" })}
          >
            🚪 Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
