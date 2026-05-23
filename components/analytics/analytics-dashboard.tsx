"use client";

import React from "react";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AnalyticsDashboardProps {
  groupId: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-CM", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(value || 0)
}

function AnalyticsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border bg-background/95 px-3 py-2 text-sm shadow-lg backdrop-blur">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="text-muted-foreground">
          <span style={{ color: entry.color }}>{entry.name || entry.dataKey}: </span>
          {typeof entry.value === "number" ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  sparkline,
  className = "",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  sparkline?: Array<{ month: string; amount: number }>;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden rounded-2xl shadow-sm ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
        </div>
        <div className="rounded-full bg-muted p-2 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {sparkline?.length ? (
          <div className="h-12 w-full overflow-hidden rounded-lg bg-muted/30 px-1 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <defs>
                  <linearGradient id={`sparkline-fill-${title.replace(/\s+/g, "-").toLowerCase()}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill={`url(#sparkline-fill-${title.replace(/\s+/g, "-").toLowerCase()})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

export function AnalyticsDashboard({ groupId }: AnalyticsDashboardProps) {
  const { metrics, loading, error, refetch, exportToCSV, exportToPDF } =
    useAnalytics(groupId);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Error Loading Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error.message}</p>
          <Button onClick={refetch} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            No data available yet. Contributions will appear once members make
            payments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{metrics.groupName} Analytics</h2>
          <p className="text-sm text-gray-600">
            Generated {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Contributed"
          value={formatCurrency(metrics.totalContributed)}
          subtitle="All members combined"
          icon={<TrendingUp className="h-5 w-5" />}
          sparkline={metrics.contributionTrend}
        />
        <MetricCard
          title="Total Paid Out"
          value={formatCurrency(metrics.totalPaidOut)}
          subtitle="To recipients"
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <MetricCard
          title="Members"
          value={`${metrics.activeMembers}/${metrics.totalMembers}`}
          subtitle={`${metrics.participationRate}% participation`}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Default Rate"
          value={`${metrics.defaultRate}%`}
          subtitle={`${Math.round((metrics.defaultRate / 100) * metrics.totalMembers)} members`}
          icon={<AlertCircle className="h-5 w-5" />}
          className={metrics.defaultRate > 20 ? "border-red-200 bg-red-50" : ""}
        />
      </div>

      {/* Pending & Cycle Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Pending</p>
                    <p className="text-3xl font-bold text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
              </div>
              {metrics.nextPayoutDate && (
                <div>
                  <p className="text-sm text-gray-600">Next Payout</p>
                  <p className="font-semibold">
                    {new Date(metrics.nextPayoutDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                        Amount: {formatCurrency(metrics.nextPayoutAmount || 0)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cycle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-semibold">
                  {metrics.cycleStartDate
                    ? new Date(metrics.cycleStartDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              {metrics.cycleEndDate && (
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-semibold">
                    {new Date(metrics.cycleEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Contribution Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contribution Trend</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.contributionTrend}>
                <defs>
                  <linearGradient id="trend-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} interval={1} />
                <YAxis tickLine={false} axisLine={false} width={80} tickFormatter={(value) => formatCurrency(value as number)} />
                <Tooltip content={<AnalyticsTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="url(#trend-stroke)"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 2, fill: "#ffffff" }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="none"
                  fill="url(#trend-fill)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
            <CardDescription>By transaction count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.paymentBreakdown}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {metrics.paymentBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<AnalyticsTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Contributors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
          <CardDescription>Members with highest contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topContributors.map((contributor) => (
              <div key={contributor.userId} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                <div>
                  <p className="font-semibold">{contributor.userName}</p>
                  <p className="text-sm text-gray-600">
                    {contributor.contributionCount} contributions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{contributor.totalContributed}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Member Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Member Statistics</CardTitle>
          <CardDescription>
            Detailed breakdown of each member's participation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Contributed</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Last Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.memberStats.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell className="font-semibold">
                      {member.userName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {member.email}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.totalContributed}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          member.status === "active"
                            ? "default"
                            : member.status === "defaulted"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {member.lastContributionDate
                        ? new Date(
                            member.lastContributionDate
                          ).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
