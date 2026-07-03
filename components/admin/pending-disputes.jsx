"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { containerVariants, itemVariants } from "@/lib/animations"

export function PendingDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchDisputes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/disputes")
      const data = await res.json()

      // Handle array response
      const disputesArray = Array.isArray(data) ? data : data.disputes || []
      setDisputes(disputesArray.filter((d) => d.status === "OPEN").slice(0, 5))
    } catch (error) {
      console.error("Failed to fetch disputes:", error)
      setDisputes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDisputes() }, [fetchDisputes])

  const handleResolve = async (disputeId, resolution) => {
    setActionLoading(disputeId + resolution)
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(resolution === "UPHELD" ? "Dispute upheld" : "Dispute rejected")
      setDisputes((prev) => prev.filter((d) => d.id !== disputeId))
    } catch (err) {
      toast.error(err.message || "Failed to resolve dispute")
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/70 bg-card/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Pending Disputes</CardTitle>
          <ShieldAlert className="h-4 w-4 text-amber-500" />
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
    <Card className="border-border/70 bg-card/90 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
      <CardHeader className="border-b border-border/60 pb-4">
        <CardTitle className="flex justify-between items-center">
          <span>Pending Disputes</span>
          <Badge variant="destructive" className="rounded-full px-3 py-1">{disputes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div className="space-y-4 pt-4" variants={containerVariants} initial="initial" animate="animate">
          {disputes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending disputes</p>
          ) : (
            disputes.map((dispute) => (
              <motion.div key={dispute.id} variants={itemVariants} whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.18 }} className="rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-foreground">{dispute.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dispute.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <Badge variant="outline" className="rounded-full">{dispute.group?.name}</Badge>
                  <Badge className="rounded-full bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">{dispute.status}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={actionLoading !== null}
                    onClick={() => handleResolve(dispute.id, "UPHELD")}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Uphold
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    disabled={actionLoading !== null}
                    onClick={() => handleResolve(dispute.id, "REJECTED")}
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />Reject
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </CardContent>
    </Card>
  )
}
