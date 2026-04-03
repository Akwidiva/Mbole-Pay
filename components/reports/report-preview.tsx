/**
 * Report Preview Component
 * Display report data preview before generation
 */

"use client";

import { useEffect, useState } from "react";
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
import { ReportType } from "@/types/reports";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ReportPreviewProps {
  reportType: ReportType;
  groupId?: string;
  userId?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}

export function ReportPreview({
  reportType,
  groupId,
  userId,
  dateRange,
  startDate,
  endDate,
}: ReportPreviewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          reportType,
          ...(groupId && { groupId }),
          ...(userId && { userId }),
          ...(dateRange && { dateRange }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        });

        const response = await fetch(`/api/reports/preview?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch preview");
        }

        const result = await response.json();
        setData(result.preview);
      } catch (error) {
        console.error("Error fetching preview:", error);
        toast({
          title: "Error",
          description: "Failed to load report preview",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [reportType, groupId, userId, dateRange, startDate, endDate, toast]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
          <CardDescription>No data available for preview</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Preview</CardTitle>
        <CardDescription>
          Preview of the data that will be included in your report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Group Summary - Show financial stats */}
        {reportType === ReportType.GROUP_SUMMARY && data.stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Contributions</p>
                <p className="text-2xl font-bold">{data.stats.totalContributions}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{data.stats.completionRate.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(data.stats.paidAmount)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">{formatCurrency(data.stats.pendingAmount)}</p>
              </div>
            </div>

            {/* Contributions Table */}
            {data.contributions && data.contributions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Recent Contributions</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.contributions.slice(0, 5).map((contrib: any) => (
                        <TableRow key={contrib.id}>
                          <TableCell>{contrib.userName}</TableCell>
                          <TableCell>{formatCurrency(contrib.amount)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                contrib.status === "PAID"
                                  ? "default"
                                  : contrib.status === "OVERDUE"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {contrib.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(contrib.dueDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {data.contributions.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    ... and {data.contributions.length - 5} more contributions
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Individual Statement */}
        {reportType === ReportType.INDIVIDUAL_STATEMENT && data.totalStats && (
          <div className="space-y-4">
            {data.email && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Member</p>
                <p className="font-semibold">{data.userName}</p>
                <p className="text-sm text-muted-foreground">{data.email}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Contributions</p>
                <p className="text-2xl font-bold">{data.totalStats.totalContributions}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalStats.paidAmount)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.totalStats.pendingAmount)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(data.totalStats.overdueAmount)}
                </p>
              </div>
            </div>

            {/* Groups Table */}
            {data.groups && data.groups.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Groups</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group</TableHead>
                        <TableHead>Contributions</TableHead>
                        <TableHead>Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.groups.slice(0, 5).map((group: any) => (
                        <TableRow key={group.groupId}>
                          <TableCell>{group.groupName}</TableCell>
                          <TableCell>{group.stats.totalContributions}</TableCell>
                          <TableCell>
                            {group.stats.completionRate.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generic JSON preview for other report types */}
        {reportType !== ReportType.GROUP_SUMMARY &&
          reportType !== ReportType.INDIVIDUAL_STATEMENT && (
            <div className="space-y-2">
              <h3 className="font-semibold">Report Data (JSON)</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "XAF",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
