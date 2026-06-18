"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Gift, ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RecipientGroup {
  groupId: string
  groupName: string
  cycle: number
  totalPool: number
  cycleStarted: boolean
  paidCount: number
  totalCount: number
  payoutReady: boolean
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CM", { style: "currency", currency: "XAF", minimumFractionDigits: 0 }).format(n)

export function RecipientAlert() {
  const [groups, setGroups] = useState<RecipientGroup[]>([])

  useEffect(() => {
    fetch("/api/user/recipient-groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.data || []))
      .catch(() => {})
  }, [])

  if (groups.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {groups.map((g) => (
        <div
          key={g.groupId}
          className="flex items-center gap-4 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 dark:border-purple-800 px-5 py-4"
        >
          <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-purple-900 dark:text-purple-100 truncate">
              🎉 You are the recipient for <span className="underline">{g.groupName}</span> — Cycle {g.cycle}
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-0.5">
              {g.cycleStarted ? (
                g.payoutReady
                  ? `${fmt(g.totalPool)} is being sent to you now!`
                  : `${g.paidCount} of ${g.totalCount} members paid — waiting for ${g.totalCount - g.paidCount} more`
              ) : (
                `${fmt(g.totalPool)} will be sent to you once everyone pays`
              )}
            </p>
          </div>

          <Button asChild size="sm" variant="outline" className="shrink-0 border-purple-300 text-purple-800 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-200">
            <Link href={`/groups/${g.groupId}`}>
              View group
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  )
}
