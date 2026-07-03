"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Ban, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function UserDetailActions({ userId, suspended, isSelf }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSuspendToggle = async () => {
    const action = suspended ? "reactivate" : "suspend"
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(action === "suspend" ? "User suspended" : "User reactivated")
      router.refresh()
    } catch (err) {
      toast.error(err.message || "Action failed")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("User deleted")
      router.push("/admin/users")
    } catch (err) {
      toast.error(err.message || "Delete failed")
      setLoading(false)
    }
  }

  if (isSelf) return null

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={loading} onClick={handleSuspendToggle}>
        {suspended ? (
          <><RotateCcw className="mr-1 h-3.5 w-3.5" />Reactivate</>
        ) : (
          <><Ban className="mr-1 h-3.5 w-3.5" />Suspend</>
        )}
      </Button>
      <Button size="sm" variant="destructive" disabled={loading} onClick={handleDelete}>
        <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
      </Button>
    </div>
  )
}
