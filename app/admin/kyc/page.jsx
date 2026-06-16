"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react"
import { toast } from "sonner"

const GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs"

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [rejectionReasons, setRejectionReasons] = useState({})

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/kyc")
      const data = await res.json()
      setSubmissions(data.submissions || [])
    } catch {
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])

  const handleAction = async (userId, action) => {
    const reason = rejectionReasons[userId] || ""
    if (action === "reject" && !reason.trim()) {
      toast.error("Please enter a rejection reason")
      return
    }

    setActionLoading(userId + action)
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(action === "approve" ? "User approved" : "User rejected — email sent")
      setSubmissions((prev) => prev.filter((s) => s.id !== userId))
    } catch (err) {
      toast.error(err.message || "Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC Review</h1>
          <p className="text-sm text-muted-foreground">
            Review identity documents and approve or reject accounts
          </p>
        </div>
        <Button variant="outline" onClick={fetchSubmissions} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No pending submissions</p>
          <p className="text-sm text-muted-foreground">All KYC requests have been reviewed</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {submissions.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{user.name || "—"}</CardTitle>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.phone && (
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    )}
                  </div>
                  <Badge variant={user.kycStatus === "REJECTED" ? "destructive" : "secondary"}>
                    {user.kycStatus}
                  </Badge>
                </div>
                {user.kycSubmittedAt && (
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(user.kycSubmittedAt).toLocaleString()}
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Document previews */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">National ID</p>
                    {user.idDocumentCid ? (
                      <a
                        href={`${GATEWAY}/${user.idDocumentCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block overflow-hidden rounded-lg border bg-muted"
                      >
                        <img
                          src={`${GATEWAY}/${user.idDocumentCid}`}
                          alt="National ID"
                          className="h-32 w-full object-cover transition group-hover:opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                          <ExternalLink className="h-5 w-5 text-white drop-shadow" />
                        </div>
                      </a>
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                        No file
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Selfie</p>
                    {user.selfiePhotoCid ? (
                      <a
                        href={`${GATEWAY}/${user.selfiePhotoCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative block overflow-hidden rounded-lg border bg-muted"
                      >
                        <img
                          src={`${GATEWAY}/${user.selfiePhotoCid}`}
                          alt="Selfie"
                          className="h-32 w-full object-cover transition group-hover:opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                          <ExternalLink className="h-5 w-5 text-white drop-shadow" />
                        </div>
                      </a>
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                        No file
                      </div>
                    )}
                  </div>
                </div>

                {/* Previous rejection reason */}
                {user.kycRejectionReason && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <span className="font-medium">Previous rejection:</span> {user.kycRejectionReason}
                  </div>
                )}

                {/* Rejection reason input */}
                <Textarea
                  placeholder="Rejection reason (required if rejecting)"
                  value={rejectionReasons[user.id] || ""}
                  onChange={(e) =>
                    setRejectionReasons((prev) => ({ ...prev, [user.id]: e.target.value }))
                  }
                  rows={2}
                  className="text-sm"
                />

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleAction(user.id, "approve")}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === user.id + "approve" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleAction(user.id, "reject")}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === user.id + "reject" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
