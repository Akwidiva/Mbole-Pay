"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export function PendingDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDisputes() {
      try {
        const res = await fetch("/api/admin/disputes")
        const data = await res.json()
        
        // Handle array response
        const disputesArray = Array.isArray(data) ? data : data.disputes || []
        setDisputes(disputesArray.filter(d => d.status === "ACTIVE").slice(0, 5))
      } catch (error) {
        console.error("Failed to fetch disputes:", error)
        setDisputes([])
      } finally {
        setLoading(false)
      }
    }

    fetchDisputes()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
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
          <span>Pending Disputes</span>
          <Badge variant="destructive">{disputes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <p className="text-sm text-gray-500">No pending disputes</p>
          ) : (
            disputes.map((dispute) => (
              <div key={dispute.id} className="pb-3 border-b last:border-0">
                <p className="font-medium text-sm">{dispute.title}</p>
                <p className="text-xs text-gray-500 mt-1">{dispute.description}</p>
                <div className="mt-2 flex justify-between text-xs">
                  <Badge variant="outline">{dispute.group?.name}</Badge>
                  <Badge>{dispute.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
