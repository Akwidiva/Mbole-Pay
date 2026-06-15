"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Building2, Users2 } from "lucide-react"
import { motion } from "framer-motion"
import { containerVariants, itemVariants } from "@/lib/animations"

export function AllGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch("/api/admin/groups")
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error || data?.details || "Failed to fetch groups")
        }

        const groupsList = Array.isArray(data) ? data : data?.groups || []
        setGroups(groupsList.slice(0, 10))
        setErrorMessage("")
      } catch (error) {
        console.error("Failed to fetch groups:", error)
        setErrorMessage(error?.message || "Failed to load groups right now")
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  if (loading) {
    return (
      <Card className="border-border/70 bg-card/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>All Groups</CardTitle>
          <Building2 className="h-4 w-4 text-secondary" />
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
          <span>All Groups</span>
          <Badge className="rounded-full bg-secondary/10 text-secondary hover:bg-secondary/10">{groups.length}</Badge>
        </CardTitle>
        <Building2 className="h-4 w-4 text-secondary" />
      </CardHeader>
      <CardContent>
        <motion.div className="space-y-4 pt-4" variants={containerVariants} initial="initial" animate="animate">
          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No groups found</p>
          ) : (
            groups.map((group) => (
              <motion.div key={group.id} variants={itemVariants} whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.18 }} className="rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{group.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>
                  </div>
                  <div className="rounded-2xl bg-primary/5 p-2 text-primary">
                    <Users2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="rounded-full">{group.frequency}</Badge>
                  <Badge variant="outline" className="rounded-full">{group.memberCount} members</Badge>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </CardContent>
    </Card>
  )
}
