import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/db"

/**
 * GET /api/reports/download?groupId=xxx&format=csv|pdf&type=group|statement
 *
 * Returns actual downloadable file bytes:
 * - CSV: text/csv with Content-Disposition: attachment
 * - PDF: printer-ready HTML page (user prints/saves as PDF from browser)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get("groupId")
  const format = searchParams.get("format") || "csv"  // csv | pdf
  const type = searchParams.get("type") || "statement" // group | statement

  if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 })

  // Verify membership
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  })
  if (!membership) return NextResponse.json({ error: "Not a member of this group" }, { status: 403 })

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 })

  if (type === "group" && membership.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can download group reports" }, { status: 403 })
  }

  const targetUserId = type === "group" ? null : user.id

  // Fetch data
  const [contributions, payouts, disputes] = await Promise.all([
    prisma.contribution.findMany({
      where: { groupId, ...(targetUserId ? { userId: targetUserId } : {}) },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payout.findMany({
      where: { groupId, ...(targetUserId ? { recipientId: targetUserId } : {}) },
      include: { recipient: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dispute.findMany({
      where: { groupId },
      include: { votes: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const generatedAt = new Date().toLocaleString("en-CM")
  const title = type === "group"
    ? `${group.name} — Group Financial Report`
    : `${user.name || user.email} — Member Statement (${group.name})`

  if (format === "csv") {
    const rows: string[] = []

    // Contributions section
    rows.push("CONTRIBUTIONS")
    rows.push("Member,Amount (XAF),Status,Cycle,Due Date,Paid Date")
    for (const c of contributions) {
      rows.push([
        `"${c.user.name || c.user.email}"`,
        c.amount,
        c.status,
        c.cycle,
        c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "",
        c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "",
      ].join(","))
    }

    rows.push("")
    rows.push("PAYOUTS")
    rows.push("Recipient,Amount (XAF),Status,Cycle,Date")
    for (const p of payouts) {
      rows.push([
        `"${p.recipient.name || p.recipient.email}"`,
        p.amount,
        p.status,
        p.cycle,
        p.processedDate ? new Date(p.processedDate).toLocaleDateString() : "",
      ].join(","))
    }

    rows.push("")
    rows.push("DISPUTES")
    rows.push("Title,Category,Status,Resolution,Filed Date,Votes")
    for (const d of disputes) {
      const uphold = d.votes.filter((v) => v.vote === "UPHOLD").length
      const reject = d.votes.filter((v) => v.vote === "REJECT").length
      rows.push([
        `"${d.title}"`,
        d.category,
        d.status,
        d.resolution || "",
        new Date(d.createdAt).toLocaleDateString(),
        `${uphold} uphold / ${reject} reject`,
      ].join(","))
    }

    rows.push("")
    rows.push(`Generated,${generatedAt}`)

    const csv = rows.join("\r\n")
    const filename = `${group.name.replace(/\s+/g, "_")}_report_${Date.now()}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  }

  // PDF: return printer-ready HTML — user prints/saves as PDF from browser
  const totalContributed = contributions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amount, 0)
  const totalReceived = payouts.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.amount, 0)
  const complianceRate = contributions.length
    ? Math.round((contributions.filter((c) => c.status === "PAID").length / contributions.length) * 100)
    : 0

  const contribRows = contributions.map((c) => `
    <tr>
      <td>${c.user.name || c.user.email}</td>
      <td>${c.amount.toLocaleString()} XAF</td>
      <td><span class="badge ${c.status.toLowerCase()}">${c.status}</span></td>
      <td>Cycle ${c.cycle}</td>
      <td>${c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "—"}</td>
      <td>${c.paidAt ? new Date(c.paidAt).toLocaleDateString() : "—"}</td>
    </tr>`).join("")

  const payoutRows = payouts.map((p) => `
    <tr>
      <td>${p.recipient.name || p.recipient.email}</td>
      <td>${p.amount.toLocaleString()} XAF</td>
      <td><span class="badge ${p.status.toLowerCase()}">${p.status}</span></td>
      <td>Cycle ${p.cycle}</td>
      <td>${p.processedDate ? new Date(p.processedDate).toLocaleDateString() : "—"}</td>
    </tr>`).join("")

  const disputeRows = disputes.map((d) => {
    const uphold = d.votes.filter((v) => v.vote === "UPHOLD").length
    const reject = d.votes.filter((v) => v.vote === "REJECT").length
    return `<tr>
      <td>${d.title}</td>
      <td>${d.category}</td>
      <td><span class="badge ${d.status.toLowerCase()}">${d.status}</span></td>
      <td>${d.resolution || "—"}</td>
      <td>${new Date(d.createdAt).toLocaleDateString()}</td>
      <td>${uphold} ↑ / ${reject} ↓</td>
    </tr>`
  }).join("")

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px; }
  h1 { font-size: 18px; color: #065f46; margin-bottom: 4px; }
  .meta { color: #555; font-size: 11px; margin-bottom: 24px; }
  .stats { display: flex; gap: 24px; margin-bottom: 28px; }
  .stat { border: 1px solid #d1fae5; border-radius: 6px; padding: 12px 20px; background: #f0fdf4; }
  .stat-value { font-size: 20px; font-weight: bold; color: #065f46; }
  .stat-label { font-size: 10px; color: #555; text-transform: uppercase; margin-top: 2px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #065f46; margin: 24px 0 8px; border-bottom: 1px solid #d1fae5; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th { background: #065f46; color: #fff; text-align: left; padding: 6px 8px; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
  tr:nth-child(even) td { background: #f9fafb; }
  .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
  .badge.paid, .badge.completed { background: #d1fae5; color: #065f46; }
  .badge.pending { background: #fef9c3; color: #854d0e; }
  .badge.failed { background: #fee2e2; color: #991b1b; }
  .badge.open { background: #dbeafe; color: #1e40af; }
  .badge.resolved { background: #d1fae5; color: #065f46; }
  .badge.expired { background: #f3f4f6; color: #6b7280; }
  .footer { margin-top: 32px; font-size: 10px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<h1>Mbole Pay — ${title}</h1>
<p class="meta">Generated ${generatedAt} &nbsp;|&nbsp; Group: ${group.name} &nbsp;|&nbsp; Frequency: ${group.frequency}</p>

<div class="stats">
  <div class="stat"><div class="stat-value">${totalContributed.toLocaleString()} XAF</div><div class="stat-label">Total Contributed</div></div>
  <div class="stat"><div class="stat-value">${totalReceived.toLocaleString()} XAF</div><div class="stat-label">Total Received</div></div>
  <div class="stat"><div class="stat-value">${complianceRate}%</div><div class="stat-label">Compliance Rate</div></div>
  <div class="stat"><div class="stat-value">${disputes.filter((d) => d.status === "OPEN").length}</div><div class="stat-label">Active Disputes</div></div>
</div>

<h2>Contributions</h2>
<table><thead><tr><th>Member</th><th>Amount</th><th>Status</th><th>Cycle</th><th>Due Date</th><th>Paid Date</th></tr></thead>
<tbody>${contribRows || "<tr><td colspan='6'>No contributions</td></tr>"}</tbody></table>

<h2>Payouts</h2>
<table><thead><tr><th>Recipient</th><th>Amount</th><th>Status</th><th>Cycle</th><th>Processed</th></tr></thead>
<tbody>${payoutRows || "<tr><td colspan='5'>No payouts</td></tr>"}</tbody></table>

<h2>Disputes</h2>
<table><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Resolution</th><th>Filed</th><th>Votes</th></tr></thead>
<tbody>${disputeRows || "<tr><td colspan='6'>No disputes</td></tr>"}</tbody></table>

<p class="footer">Mbole Pay &mdash; Confidential financial statement &mdash; ${generatedAt}</p>
<script>window.onload = () => window.print()</script>
</body>
</html>`

  const filename = `${group.name.replace(/\s+/g, "_")}_report_${Date.now()}.html`
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
