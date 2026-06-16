"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentHistoryItem, ApiResponse } from "@/types/payments";
import { Check, Clock, X, ChevronLeft, ChevronRight } from "lucide-react";

interface PaymentHistoryListProps {
  groupId?: string;
}

interface HistoryResponse {
  payments: PaymentHistoryItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    totalPaid: number;
    totalPending: number;
    totalFailed: number;
  };
}

export function PaymentHistoryList({ groupId }: PaymentHistoryListProps) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      if (groupId) params.append("groupId", groupId);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/payments/history?${params.toString()}`);
      const result: ApiResponse<HistoryResponse> = await response.json();

      if (!result.success) {
        setError(result.error?.message || "Failed to load payment history");
        return;
      }

      setData(result.data!);
    } catch (err: any) {
      setError(err.message || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0); // Reset to first page when filters change
  }, [groupId, statusFilter, limit]);

  useEffect(() => {
    fetchHistory();
  }, [page, groupId, statusFilter, limit]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Check className="w-4 h-4 text-green-600" />;
      case "PROCESSING":
      case "PENDING":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "FAILED":
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "PROCESSING":
      case "PENDING":
        return "secondary";
      case "FAILED":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>View and manage your payment transactions</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        {data?.summary && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Paid</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {data.summary.totalPaid.toLocaleString()} XAF
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Pending</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {data.summary.totalPending.toLocaleString()} XAF
              </p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Failed</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {data.summary.totalFailed.toLocaleString()} XAF
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={limit.toString()} onValueChange={(val) => setLimit(parseInt(val))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 items</SelectItem>
              <SelectItem value="10">10 items</SelectItem>
              <SelectItem value="20">20 items</SelectItem>
              <SelectItem value="50">50 items</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {/* Table */}
        {data && data.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-xs">
                      {new Date(payment.date).toLocaleDateString()} <br />
                      {new Date(payment.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      Fapshi
                    </TableCell>
                    <TableCell className="text-xs font-mono">{payment.phoneNumber}</TableCell>
                    <TableCell className="font-semibold">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <Badge variant={getStatusVariant(payment.status) as any}>
                          {payment.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{payment.groupName || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Alert>
            <AlertDescription>No payments found</AlertDescription>
          </Alert>
        )}

        {/* Pagination */}
        {data && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.pagination.total)} of{" "}
              {data.pagination.total} payments
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!data.pagination.hasMore || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
