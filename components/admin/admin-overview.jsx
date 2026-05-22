"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AdminOverview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [usersRes, groupsRes, disputesRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/admin/groups"),
          fetch("/api/admin/disputes"),
        ])

        const users = await usersRes.json()
        const groups = await groupsRes.json()
        const disputes = await disputesRes.json()

        // Handle array responses
        const disputesArray = Array.isArray(disputes) ? disputes : disputes.disputes || []
        
        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalGroups: Array.isArray(groups) ? groups.length : 0,
          activeDisputes: disputesArray.filter(d => d.status === "ACTIVE").length,
          resolvedDisputes: disputesArray.filter(d => d.status === "RESOLVED").length,
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
        setStats({
          totalUsers: 0,
          totalGroups: 0,
          activeDisputes: 0,
          resolvedDisputes: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    { label: "Total Users", value: stats?.totalUsers || 0 },
    { label: "Total Groups", value: stats?.totalGroups || 0 },
    { label: "Active Disputes", value: stats?.activeDisputes || 0 },
    { label: "Resolved Disputes", value: stats?.resolvedDisputes || 0 },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
