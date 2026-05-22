"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { VotingInterface } from "./voting-interface";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Dispute {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  votes: {
    uphold: number;
    reject: number;
    total: number;
  };
}

interface DisputeHistoryProps {
  groupId: string;
  onDisputesLoaded?: (count: number) => void;
}

export function DisputeHistory({ groupId, onDisputesLoaded }: DisputeHistoryProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, [groupId]);

  async function fetchDisputes() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes?groupId=${groupId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to fetch disputes");
      }

      setDisputes(result.data || []);
      onDisputesLoaded?.(result.data?.length || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (disputes.length === 0) {
    return (
      <Alert>
        <AlertDescription>No disputes yet. Great! Keep it fair and transparent.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Disputes</h3>
        <Badge variant="secondary">{disputes.length} total</Badge>
      </div>

      <div className="space-y-4">
        {disputes.map((dispute) => (
          <div key={dispute.id}>
            {selectedDispute === dispute.id ? (
              <div className="space-y-4">
                <VotingInterface
                  disputeId={dispute.id}
                  title={dispute.title}
                  description={dispute.description}
                  status={dispute.status}
                  currentVotes={dispute.votes}
                  onVoteSubmitted={() => fetchDisputes()}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedDispute(null)}
                >
                  Close
                </Button>
              </div>
            ) : (
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader
                  onClick={() => setSelectedDispute(dispute.id)}
                  className="pb-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{dispute.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {format(new Date(dispute.createdAt), "PPpp")}
                      </CardDescription>
                    </div>
                    <Badge variant={dispute.status === "OPEN" ? "default" : "secondary"}>
                      {dispute.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      {dispute.description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {dispute.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs">
                        <span>👍 {dispute.votes.uphold}</span>
                        <span>👎 {dispute.votes.reject}</span>
                        <span>Total: {dispute.votes.total}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDispute(dispute.id)}
                    >
                      View & Vote →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
