"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, Layers3, TriangleAlert, Users } from "lucide-react"
import { motion } from "framer-motion"
import { cardVariants, containerVariants, itemVariants } from "@/lib/animations"

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
          totalUsers: typeof users.total === "number" ? users.total : (Array.isArray(users) ? users.length : 0),
          totalGroups: Array.isArray(groups) ? groups.length : 0,
          activeDisputes: disputesArray.filter(d => d.status === "OPEN").length,
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
      <motion.div className="grid gap-4 md:grid-cols-4" variants={containerVariants} initial="initial" animate="animate">
        {[...Array(4)].map((_, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card key={i} className="overflow-hidden border-border/70 bg-card/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  const cards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, accent: "from-primary to-sky-500" },
    { label: "Total Groups", value: stats?.totalGroups || 0, icon: Layers3, accent: "from-secondary to-emerald-500" },
    { label: "Active Disputes", value: stats?.activeDisputes || 0, icon: TriangleAlert, accent: "from-amber-500 to-orange-500" },
    { label: "Resolved Disputes", value: stats?.resolvedDisputes || 0, icon: BarChart3, accent: "from-cyan-500 to-primary" },
  ]

  return (
    <motion.div className="grid gap-4 md:grid-cols-4" variants={containerVariants} initial="initial" animate="animate">
      {cards.map((card) => (
        <motion.div key={card.label} variants={itemVariants} whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }}>
          <Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
            <div className={`h-1 bg-gradient-to-r ${card.accent}`} />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-2 text-white shadow-sm`}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
