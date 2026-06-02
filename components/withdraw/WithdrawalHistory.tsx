"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

export function WithdrawalHistory({ admin = false }: { admin?: boolean }) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [emailFilter, setEmailFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("ANY")

  useEffect(() => {
    fetchRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchRecords() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (admin && emailFilter) params.set("email", emailFilter)
      if (statusFilter && statusFilter !== "ANY") params.set("status", statusFilter)
      const res = await fetch(`/api/withdrawals?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data.data || [])
      } else {
        console.error("Failed to fetch withdrawals")
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal History</CardTitle>
      </CardHeader>
      <CardContent>
        {admin && (
          <div className="mb-4 flex gap-2">
            <Input placeholder="Filter by user email" value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} />
            <Select onValueChange={(v) => setStatusFilter(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">Any</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                <SelectItem value="FAILED">FAILED</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchRecords}>Filter</Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {admin && <TableHead>User</TableHead>}
              <TableHead>Phone</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={admin ? 6 : 5}>Loading...</TableCell>
              </TableRow>
            ) : records.length > 0 ? (
              records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{format(new Date(r.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                  {admin && <TableCell>{r.user?.email || r.userId}</TableCell>}
                  <TableCell>{r.phoneNumber}</TableCell>
                  <TableCell>{Number(r.amount).toLocaleString()} XAF</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={processingId === r.id}
                        onClick={async () => {
                          if (!confirm("Retry this withdrawal request?")) return
                          setProcessingId(r.id)
                          try {
                            const res = await fetch(`/api/withdrawals/${r.id}/retry`, { method: "POST" })
                            if (res.ok) {
                              await fetchRecords()
                            } else {
                              console.error("Retry failed")
                            }
                          } catch (err) {
                            console.error(err)
                          } finally {
                            setProcessingId(null)
                          }
                        }}
                      >
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={processingId === r.id}
                        onClick={async () => {
                          if (!confirm("Cancel this withdrawal request?")) return
                          setProcessingId(r.id)
                          try {
                            const res = await fetch(`/api/withdrawals/${r.id}/cancel`, { method: "POST" })
                            if (res.ok) {
                              await fetchRecords()
                            } else {
                              console.error("Cancel failed")
                            }
                          } catch (err) {
                            console.error(err)
                          } finally {
                            setProcessingId(null)
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={admin ? 6 : 5} className="text-center">
                  No withdrawals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default WithdrawalHistory
