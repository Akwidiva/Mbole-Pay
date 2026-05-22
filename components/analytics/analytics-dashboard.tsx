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
  BarChart,
  Bar,
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
          value={`${metrics.totalContributed}`}
          subtitle="All members combined"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Total Paid Out"
          value={`${metrics.totalPaidOut}`}
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
                <p className="text-3xl font-bold">{metrics.pendingAmount}</p>
              </div>
              {metrics.nextPayoutDate && (
                <div>
                  <p className="text-sm text-gray-600">Next Payout</p>
                  <p className="font-semibold">
                    {new Date(metrics.nextPayoutDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: {metrics.nextPayoutAmount}
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  dot={false}
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
                  label
                >
                  {metrics.paymentBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
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
