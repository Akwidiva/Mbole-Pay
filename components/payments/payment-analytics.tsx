"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp } from "lucide-react";
import { ApiResponse } from "@/types/payments";

interface PaymentStats {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  completedCount: number;
  completedAmount: number;
  failedCount: number;
  failedAmount: number;
  pendingCount: number;
  pendingAmount: number;
  successRate: number; // percentage
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

interface PaymentAnalyticsProps {
  groupId?: string;
}

export function PaymentAnalytics({ groupId }: PaymentAnalyticsProps) {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (groupId) params.append("groupId", groupId);

        const response = await fetch(`/api/payments/stats?${params.toString()}`);
        const result: ApiResponse<PaymentStats> = await response.json();

        if (!result.success) {
          setError(result.error?.message || "Failed to load payment statistics");
          return;
        }

        setStats(result.data || null);
      } catch (err: any) {
        setError(err.message || "Failed to load payment statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [groupId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertDescription>No payment data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Amount */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.totalAmount / 1000).toFixed(1)}K XAF
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalTransactions} transactions
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedCount} successful
            </p>
          </CardContent>
        </Card>

        {/* Average Transaction */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.averageAmount / 1000).toFixed(1)}K XAF
            </div>
            <p className="text-xs text-muted-foreground mt-1">per transaction</p>
          </CardContent>
        </Card>

        {/* Pending Amount */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {(stats.pendingAmount / 1000).toFixed(1)}K XAF
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingCount} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Status Breakdown</CardTitle>
          <CardDescription>Detailed view of all payment statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Completed */}
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  ✓ Completed
                </h3>
                <Badge className="bg-green-600">Success</Badge>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.completedCount}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {(stats.completedAmount / 1000).toFixed(1)}K XAF
              </p>
            </div>

            {/* Pending */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  ⏳ Pending
                </h3>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.pendingCount}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {(stats.pendingAmount / 1000).toFixed(1)}K XAF
              </p>
            </div>

            {/* Failed */}
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  ✗ Failed
                </h3>
                <Badge variant="destructive">Failed</Badge>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.failedCount}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {(stats.failedAmount / 1000).toFixed(1)}K XAF
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      {stats.monthlyTrend && stats.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Trend
            </CardTitle>
            <CardDescription>Payment activity over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.monthlyTrend.map((month, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{month.month}</span>
                  <div className="flex items-center gap-3 flex-1 ml-4">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(month.amount / stats.totalAmount) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-right w-20">
                      {(month.amount / 1000).toFixed(0)}K XAF
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
