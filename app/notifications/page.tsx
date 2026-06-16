"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Bell, Check, Megaphone, ShieldCheck, ShieldX, UserCheck, UserMinus, UserX, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  groupId: string | null
  createdAt: string
}

const typeIcon = (type: string) => {
  switch (type) {
    case "ROLE_ASSIGNED":            return <UserCheck className="h-5 w-5 text-emerald-500" />
    case "ROLE_REMOVED":             return <UserMinus className="h-5 w-5 text-amber-500" />
    case "MEMBER_REMOVED":           return <UserX className="h-5 w-5 text-red-500" />
    case "ADMIN_MESSAGE":            return <Megaphone className="h-5 w-5 text-blue-500" />
    case "PAYMENT_RECEIVED":         return <Wallet className="h-5 w-5 text-emerald-500" />
    case "KYC_APPROVED":             return <ShieldCheck className="h-5 w-5 text-emerald-500" />
    case "KYC_REJECTED":             return <ShieldX className="h-5 w-5 text-red-500" />
    case "CONTRIBUTION_REMINDER_72H":
    case "CONTRIBUTION_REMINDER_24H":return <Bell className="h-5 w-5 text-amber-500" />
    case "PAYOUT_REMINDER_48H":
    case "PAYOUT_REMINDER_24H":      return <Wallet className="h-5 w-5 text-blue-500" />
    default:                         return <Bell className="h-5 w-5 text-muted-foreground" />
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Notifications"
        text="Everything happening in your groups."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <Check className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
      </DashboardHeader>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-lg font-medium text-muted-foreground">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            You'll be notified about group events, payments, and reminders here.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border border-border/60 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex gap-4 px-5 py-4 transition-colors",
                !n.read ? "bg-primary/5" : "bg-card"
              )}
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("font-semibold text-sm leading-snug", !n.read && "text-foreground")}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{n.body}</p>
                <p className="mt-1.5 text-xs text-muted-foreground/60">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
