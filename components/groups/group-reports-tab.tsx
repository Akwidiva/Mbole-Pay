"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileDown, FileText, Table, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GroupReportsTabProps {
  groupId: string
  isAdmin: boolean
}

async function downloadReport(groupId: string, format: "csv" | "pdf", type: "group" | "statement") {
  const url = `/api/reports/download?groupId=${groupId}&format=${format}&type=${type}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Download failed" }))
    throw new Error(err.error || "Download failed")
  }
  const blob = await res.blob()
  const ext = format === "csv" ? "csv" : "html"
  const filename = res.headers.get("content-disposition")?.match(/filename="(.+)"/)?.[1]
    ?? `report_${Date.now()}.${ext}`
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function GroupReportsTab({ groupId, isAdmin }: GroupReportsTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDownload = async (format: "csv" | "pdf", type: "group" | "statement") => {
    const key = `${type}-${format}`
    setLoading(key)
    try {
      await downloadReport(groupId, format, type)
      toast({ title: "Download started", description: `Your ${format.toUpperCase()} report is downloading.` })
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Member statement */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> My Statement
              </CardTitle>
              <CardDescription>Your personal contributions, payouts, and dispute history</CardDescription>
            </div>
            <Badge variant="outline">Member</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            disabled={!!loading}
            onClick={() => handleDownload("csv", "statement")}
          >
            {loading === "statement-csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Table className="h-4 w-4" />}
            Download CSV
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!!loading}
            onClick={() => handleDownload("pdf", "statement")}
          >
            {loading === "statement-pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Download PDF
          </Button>
        </CardContent>
      </Card>

      {/* Group report — admin only */}
      {isAdmin && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Group Financial Report
                </CardTitle>
                <CardDescription>All members' contributions, payouts, and disputes</CardDescription>
              </div>
              <Badge>Admin only</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              disabled={!!loading}
              onClick={() => handleDownload("csv", "group")}
            >
              {loading === "group-csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Table className="h-4 w-4" />}
              Download CSV
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={!!loading}
              onClick={() => handleDownload("pdf", "group")}
            >
              {loading === "group-pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center px-4">
        CSV opens in Excel/Sheets. PDF opens in your browser — use <strong>File → Print → Save as PDF</strong>.
      </p>
    </div>
  )
}
