"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DisputeVote {
  uphold: number;
  reject: number;
  total: number;
  totalMembers?: number;
  participated?: number;
}

interface VotingInterfaceProps {
  disputeId: string;
  title: string;
  description?: string;
  status: string;
  currentVotes?: DisputeVote;
  onVoteSubmitted?: () => void;
}

export function VotingInterface({
  disputeId,
  title,
  description,
  status,
  currentVotes = { uphold: 0, reject: 0, total: 0, totalMembers: 0, participated: 0 },
  onVoteSubmitted,
}: VotingInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [userVoted, setUserVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useState(currentVotes);

  const isDisputeOpen = status === "OPEN";
  const totalVotes = votes.uphold + votes.reject;
  const upholdPercent = totalVotes > 0 ? (votes.uphold / totalVotes) * 100 : 0;
  const rejectPercent = totalVotes > 0 ? (votes.reject / totalVotes) * 100 : 0;

  async function handleVote(voteType: "UPHOLD" | "REJECT") {
    if (!isDisputeOpen) {
      toast.error("This dispute is no longer open for voting");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vote: voteType }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to vote");
      }

      setVotes(result.data.votes);
      setUserVoted(true);
      toast.success(`Your vote (${voteType}) has been recorded`);
      onVoteSubmitted?.();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant={isDisputeOpen ? "default" : "secondary"}>
            {status === "OPEN" ? "Open for Voting" : "Resolved"}
          </Badge>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Vote Statistics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              <ThumbsUp className="h-4 w-4 inline mr-2" />
              Uphold: {votes.uphold}
            </span>
            <span className="text-muted-foreground">{upholdPercent.toFixed(0)}%</span>
          </div>
          <Progress value={upholdPercent} className="h-2" />

          <div className="flex items-center justify-between text-sm pt-2">
            <span className="font-medium">
              <ThumbsDown className="h-4 w-4 inline mr-2" />
              Reject: {votes.reject}
            </span>
            <span className="text-muted-foreground">{rejectPercent.toFixed(0)}%</span>
          </div>
          <Progress value={rejectPercent} className="h-2" />

          <div className="text-xs text-muted-foreground pt-2">
            {votes.total} of {votes.totalMembers} members voted ({votes.participated}%)
          </div>
        </div>

        {/* Voting Buttons */}
        {isDisputeOpen && (
          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1 gap-2"
              disabled={loading || !isDisputeOpen}
              onClick={() => handleVote("UPHOLD")}
              variant={userVoted ? "outline" : "default"}
            >
              <ThumbsUp className="h-4 w-4" />
              Uphold
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={loading || !isDisputeOpen}
              onClick={() => handleVote("REJECT")}
              variant="destructive"
            >
              <ThumbsDown className="h-4 w-4" />
              Reject
            </Button>
          </div>
        )}

        {userVoted && <Alert>
          <AlertDescription>Thank you for voting!</AlertDescription>
        </Alert>}

        {!isDisputeOpen && (
          <Alert>
            <AlertDescription>
              Voting on this dispute has ended. Result: {votes.uphold > votes.reject ? "Upheld" : "Rejected"}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
