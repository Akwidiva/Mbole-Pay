"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { DisputesPage as GroupDisputes } from "@/components/disputes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function DisputesPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroups() {
      try {
        const response = await fetch("/api/groups")
        if (response.ok) {
          const data = await response.json()
          const userGroups = data.groups || []
          setGroups(userGroups)
          if (userGroups.length > 0) {
            setSelectedGroupId(userGroups[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching groups:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [])

  const selectedGroup = groups.find((group) => group.id === selectedGroupId)
  const userRole =
    selectedGroup?.memberships?.find((membership) => membership.userId === session?.user?.id)?.role || "MEMBER"

  return (
    <DashboardShell>
      <div className="grid gap-1 px-2">
        <h1 className="font-heading text-3xl md:text-4xl">Disputes</h1>
        <p className="text-lg text-muted-foreground">
          Manage and vote on active disputes within your groups.
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : groups.length === 0 ? (
        <Alert>
          <AlertDescription>
            You need to join a savings group before you can raise or vote on disputes.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedGroup && (
            <GroupDisputes groupId={selectedGroup.id} groupName={selectedGroup.name} userRole={userRole} />
          )}
        </div>
      )}
    </DashboardShell>
  )
}
