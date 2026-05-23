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

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const PRIMARY_CHART_COLOR = "hsl(var(--chart-1))";
const SECONDARY_CHART_COLOR = "hsl(var(--chart-5))";

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
          <span style={{ color: entry.color || PRIMARY_CHART_COLOR }}>
            {entry.name || entry.dataKey}: 
          </span>
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
  sparklineColor = PRIMARY_CHART_COLOR,
  className = "",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  sparkline?: Array<{ month: string; amount: number }>;
  sparklineColor?: string;
  className?: string;
}) {
  const gradientId = `sparkline-fill-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <Card className={`overflow-hidden rounded-2xl shadow-sm ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2 sm:gap-4">
        <div className="min-w-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="truncate text-2xl font-bold tracking-tight">{value}</div>
        </div>
        <div className="rounded-full bg-muted p-2 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {sparkline?.length ? (
          <div className="h-12 w-full overflow-hidden rounded-lg bg-muted/30 px-1 pt-1 sm:h-14">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={sparklineColor} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={sparklineColor}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
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
    <div className="space-y-6 pb-4 sm:pb-0">
      {/* Header with Export Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{metrics.groupName} Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Generated {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF} className="w-full sm:w-auto">
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
          sparklineColor={PRIMARY_CHART_COLOR}
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
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-3xl font-bold tracking-tight text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
              </div>
              {metrics.nextPayoutDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Next Payout</p>
                  <p className="font-semibold">
                    {new Date(metrics.nextPayoutDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Amount: {formatCurrency(metrics.nextPayoutAmount || 0)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Cycle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-semibold">
                  {metrics.cycleStartDate
                    ? new Date(metrics.cycleStartDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              {metrics.cycleEndDate && (
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
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
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Contribution Trend</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={metrics.contributionTrend}>
                <defs>
                  <linearGradient id="trend-stroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={PRIMARY_CHART_COLOR} />
                    <stop offset="100%" stopColor={SECONDARY_CHART_COLOR} />
                  </linearGradient>
                  <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY_CHART_COLOR} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={PRIMARY_CHART_COLOR} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} interval={0} minTickGap={18} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
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
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
            <CardDescription>By transaction count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={metrics.paymentBreakdown}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={92}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {metrics.paymentBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
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
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
          <CardDescription>Members with highest contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topContributors.map((contributor) => (
              <div key={contributor.userId} className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="font-semibold">{contributor.userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {contributor.contributionCount} contributions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(contributor.totalContributed)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Member Statistics Table */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Member Statistics</CardTitle>
          <CardDescription>
            Detailed breakdown of each member's participation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto rounded-b-2xl border-t sm:border-0">
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
