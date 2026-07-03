"use client"

import { useState, useEffect, useMemo } from "react"
import { TransactionsHeader } from "@/components/transactions/transactions-header"
import { TransactionsFilter } from "@/components/transactions/transactions-filter"
import { TransactionsList } from "@/components/transactions/transactions-list"
import { toast } from "sonner"

const DEFAULT_FILTERS = { search: "", groupId: "all", type: "all", status: "all", dateRange: "30" }

function withinDateRange(dateStr, range) {
  if (range === "all") return true
  const date = new Date(dateStr)
  const now = new Date()
  if (range === "year") return date.getFullYear() === now.getFullYear()
  const days = Number(range)
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return date >= cutoff
}

async function exportToPdf(rows) {
  const { jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default

  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text("Mbole Pay — Transaction History", 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated ${new Date().toLocaleString()} — ${rows.length} transaction(s)`, 14, 25)

  autoTable(doc, {
    startY: 32,
    head: [["Date", "Group", "Type", "Amount (XAF)", "Status", "Reference"]],
    body: rows.map((t) => [
      new Date(t.createdAt).toLocaleDateString(),
      t.group?.name ?? "Unknown",
      t.type,
      (t.type === "payout" ? "+" : "-") + t.amount.toLocaleString(),
      t.status,
      t.reference,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 42, 67] },
  })

  doc.save(`transactions-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function TransactionsPanel() {
  const [transactions, setTransactions] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [txRes, groupsRes] = await Promise.all([
          fetch("/api/transactions"),
          fetch("/api/groups"),
        ])
        if (txRes.ok) setTransactions(await txRes.json())
        if (groupsRes.ok) {
          const g = await groupsRes.json()
          setGroups((Array.isArray(g) ? g : g.data || []).map((x) => ({ id: x.id, name: x.name })))
        }
      } catch (error) {
        console.error("Error loading transactions:", error)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return transactions.filter((t) => {
      if (filters.groupId !== "all" && t.group?.id !== filters.groupId) return false
      if (filters.type !== "all" && t.type !== filters.type) return false
      if (filters.status !== "all" && t.status !== filters.status) return false
      if (!withinDateRange(t.createdAt, filters.dateRange)) return false
      if (q && !(t.group?.name?.toLowerCase().includes(q) || t.reference?.toLowerCase().includes(q))) return false
      return true
    })
  }, [transactions, filters])

  const handleExport = async () => {
    if (filtered.length === 0) {
      toast.error("No transactions to export")
      return
    }
    try {
      await exportToPdf(filtered)
      toast.success(`Exported ${filtered.length} transaction(s)`)
    } catch (error) {
      console.error("PDF export failed:", error)
      toast.error("Failed to generate PDF")
    }
  }

  return (
    <>
      <TransactionsHeader
        heading="Transactions"
        text="View and manage all your financial activities."
        onExport={handleExport}
        disabled={loading}
      />
      <TransactionsFilter groups={groups} filters={filters} onChange={setFilters} />
      <TransactionsList transactions={filtered} loading={loading} />
    </>
  )
}
