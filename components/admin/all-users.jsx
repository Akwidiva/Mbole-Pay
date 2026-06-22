"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Mail, ShieldCheck, Users } from "lucide-react"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"

export function AllUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users")
        const data = await res.json()
        setUsers(data.slice(0, 10))
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) {
    return (
      <Card className="border-border/70 bg-card/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>All Users</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/70 bg-card/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4">
        <CardTitle className="flex justify-between items-center">
          <span>All Users</span>
          <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">{users.length}</Badge>
        </CardTitle>
        <Users className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <motion.div className="space-y-4 pt-4" variants={containerVariants} initial="initial" animate="animate">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found</p>
          ) : (
            users.map((user) => (
              <motion.div key={user.id} variants={itemVariants} whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.18 }} className="flex items-center justify-between rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-sm">
                <Link href={`/admin/users/${user.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </Link>
                <Badge
                  variant={user.role === "ADMIN" ? "default" : "secondary"}
                  className="rounded-full px-3 py-1"
                >
                  {user.role}
                </Badge>
              </motion.div>
            ))
          )}
        </motion.div>
      </CardContent>
    </Card>
  )
}
