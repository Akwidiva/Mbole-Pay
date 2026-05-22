"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export function AllGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroups() {
      try {
        const res = await fetch("/api/admin/groups")
        const data = await res.json()
        setGroups(data.slice(0, 10))
      } catch (error) {
        console.error("Failed to fetch groups:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchGroups()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Groups</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>All Groups</span>
          <Badge>{groups.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groups.length === 0 ? (
            <p className="text-sm text-gray-500">No groups found</p>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="pb-3 border-b last:border-0">
                <p className="font-medium text-sm">{group.name}</p>
                <p className="text-xs text-gray-500">{group.description}</p>
                <div className="mt-2 flex gap-2 text-xs">
                  <Badge variant="outline">{group.frequency}</Badge>
                  <Badge variant="outline">{group.memberCount} members</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
