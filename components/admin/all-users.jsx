"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Users, Ban, RotateCcw, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { containerVariants, itemVariants } from "@/lib/animations"

const PAGE_SIZE = 10

export function AllUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState("")
  const [role, setRole] = useState("")
  const [kycStatus, setKycStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (q.trim()) params.set("q", q.trim())
      if (role) params.set("role", role)
      if (kycStatus) params.set("kycStatus", kycStatus)

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setUsers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, q, role, kycStatus])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [q, role, kycStatus])

  const handleSuspendToggle = async (user) => {
    const action = user.suspended ? "reactivate" : "suspend"
    setActionLoading(user.id + action)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(action === "suspend" ? "User suspended" : "User reactivated")
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, suspended: !u.suspended } : u)))
    } catch (err) {
      toast.error(err.message || "Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (user) => {
    if (!confirm(`Permanently delete ${user.name || user.email}? This cannot be undone.`)) return
    setActionLoading(user.id + "delete")
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("User deleted")
      fetchUsers()
    } catch (err) {
      toast.error(err.message || "Delete failed")
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <Card className="border-border/70 bg-card/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4">
        <CardTitle className="flex items-center gap-2">
          <span>All Users</span>
          <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">{total}</Badge>
        </CardTitle>
        <Users className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:max-w-xs"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All roles</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
          <select
            value={kycStatus}
            onChange={(e) => setKycStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All KYC statuses</option>
            <option value="NONE">NONE</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <motion.div className="space-y-3 pt-4" variants={containerVariants} initial="initial" animate="animate">
          {loading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found</p>
          ) : (
            users.map((user) => (
              <motion.div
                key={user.id}
                variants={itemVariants}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <Link href={`/admin/users/${user.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "default" : "secondary"} className="rounded-full px-3 py-1">
                    {user.role}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1">{user.kycStatus}</Badge>
                  {user.suspended && (
                    <Badge variant="destructive" className="rounded-full px-3 py-1">SUSPENDED</Badge>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actionLoading !== null}
                    onClick={() => handleSuspendToggle(user)}
                  >
                    {user.suspended ? (
                      <><RotateCcw className="mr-1 h-3.5 w-3.5" />Reactivate</>
                    ) : (
                      <><Ban className="mr-1 h-3.5 w-3.5" />Suspend</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={actionLoading !== null}
                    onClick={() => handleDelete(user)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />Prev
            </Button>
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next<ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
