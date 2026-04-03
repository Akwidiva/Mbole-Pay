"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiResponse } from "@/types/payments";
import Link from "next/link";
import { AlertCircle, Calendar, ArrowRight } from "lucide-react";

interface UpcomingContributionsProps {
  groupId: string;
  groupName: string;
  limit?: number;
}

interface UpcomingContribution {
  id: string;
  userName: string;
  amount: number;
  dueDate: string;
  status: string;
  isOverdue: boolean;
  daysUntilDue?: number;
}

export function UpcomingContributions({
  groupId,
  groupName,
  limit = 3,
}: UpcomingContributionsProps) {
  const [contributions, setContributions] = useState<UpcomingContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const thisMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
        const response = await fetch(
          `/api/contributions/calendar?groupId=${groupId}&month=${thisMonth}`
        );
        const result: ApiResponse<any> = await response.json();

        if (!result.success) {
          setError(result.error?.message || "Failed to load contributions");
          return;
        }

        const allContributions = result.data?.contributions || [];
        const upcoming = allContributions
          .filter((c: any) => c.status !== "PAID")
          .map((c: any) => {
            const dueDate = new Date(c.dueDate);
            const today = new Date();
            const daysUntilDue = Math.ceil(
              (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              ...c,
              daysUntilDue,
            };
          })
          .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, limit);

        setContributions(upcoming);
      } catch (err: any) {
        setError(err.message || "Failed to load contributions");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, [groupId, limit]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Contributions
          </CardTitle>
          <CardDescription>{groupName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Contributions
        </CardTitle>
        <CardDescription>{groupName}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {contributions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No upcoming contributions this month</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {contributions.map((contrib) => {
                const dueDate = new Date(contrib.dueDate);
                const isOverdue = contrib.isOverdue;
                const isDueSoon = !isOverdue && (contrib.daysUntilDue || 0) <= 3;

                return (
                  <div
                    key={contrib.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isOverdue
                        ? "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900"
                        : isDueSoon
                          ? "border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900"
                          : "border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="truncate font-medium">{contrib.userName}</span>
                      <Badge
                        variant={isOverdue ? "destructive" : isDueSoon ? "secondary" : "outline"}
                        className="ml-2"
                      >
                        {isOverdue ? "OVERDUE" : isDueSoon ? "DUE SOON" : "PENDING"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold">{contrib.amount.toLocaleString()} XAF</p>
                        <p className="text-xs text-muted-foreground">
                          {dueDate.toLocaleDateString()}
                        </p>
                      </div>
                      {contrib.daysUntilDue !== undefined && (
                        <span className="text-xs font-bold px-2 py-1 rounded bg-background">
                          {isOverdue
                            ? `${Math.abs(contrib.daysUntilDue)} days ago`
                            : contrib.daysUntilDue === 0
                              ? "Today"
                              : `${contrib.daysUntilDue} days left`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Link href={`/groups/${groupId}/calendar`} className="block pt-2">
              <Button variant="outline" className="w-full" size="sm">
                View Full Calendar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
