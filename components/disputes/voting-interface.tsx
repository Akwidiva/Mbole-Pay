"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const QUORUM = 60;

const CATEGORY_LABELS: Record<string, string> = {
  PAYMENT: "Payment Issue",
  PAYOUT: "Payout Dispute",
  MEMBER_CONDUCT: "Member Conduct",
  RULE_VIOLATION: "Rule Violation",
  OTHER: "Other",
};

interface DisputeVote {
  uphold: number;
  reject: number;
  total: number;
  totalMembers?: number;
  participationPct?: number;
  participated?: number;
}

interface VotingInterfaceProps {
  disputeId: string;
  title: string;
  description?: string;
  category?: string;
  status: string;
  resolution?: string | null;
  votingDeadline?: string | null;
  currentVotes?: DisputeVote;
  onVoteSubmitted?: () => void;
}

function useCountdown(deadline: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Voting closed"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(h > 24 ? `${Math.floor(h / 24)}d ${h % 24}h left` : `${h}h ${m}m left`);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [deadline]);

  return timeLeft;
}

export function VotingInterface({
  disputeId, title, description, category, status, resolution,
  votingDeadline, currentVotes = { uphold: 0, reject: 0, total: 0, totalMembers: 0, participated: 0 },
  onVoteSubmitted,
}: VotingInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [userVoted, setUserVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useState(currentVotes);
  const [resolvedStatus, setResolvedStatus] = useState(status);
  const [resolvedOutcome, setResolvedOutcome] = useState(resolution);
  const countdown = useCountdown(votingDeadline);

  const isOpen = resolvedStatus === "OPEN";
  const isExpired = resolvedStatus === "EXPIRED";
  const isResolved = resolvedStatus === "RESOLVED";
  const totalVotes = votes.uphold + votes.reject;
  const upholdPct = totalVotes > 0 ? (votes.uphold / totalVotes) * 100 : 0;
  const rejectPct = totalVotes > 0 ? (votes.reject / totalVotes) * 100 : 0;
  const participation = votes.totalMembers ? Math.round((totalVotes / votes.totalMembers) * 100) : (votes.participated ?? 0);
  const quorumReached = participation >= QUORUM;

  async function handleVote(voteType: "UPHOLD" | "REJECT") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: voteType }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Failed to vote");
      setVotes(result.data.votes);
      setUserVoted(true);
      if (result.data.resolved) {
        setResolvedStatus("RESOLVED");
        setResolvedOutcome(result.data.resolution);
        toast.success(`Dispute resolved — ${result.data.resolution}`);
      } else {
        toast.success("Vote recorded anonymously");
      }
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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            {description && <CardDescription className="text-sm">{description}</CardDescription>}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant={isOpen ? "default" : isExpired ? "outline" : "secondary"} className={isResolved && resolvedOutcome === "UPHELD" ? "bg-green-600" : isResolved ? "bg-red-600 text-white" : ""}>
              {isOpen ? "Open" : isExpired ? "Expired" : resolvedOutcome ?? "Resolved"}
            </Badge>
            {category && <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[category] ?? category}</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Deadline + quorum */}
        {isOpen && (
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{countdown}</span>
            <span className={quorumReached ? "text-green-600 font-medium" : ""}>
              {participation}% participation · {QUORUM}% needed
            </span>
          </div>
        )}

        {/* Vote bars */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium"><ThumbsUp className="h-4 w-4 text-green-600" />Uphold ({votes.uphold})</span>
              <span className="text-muted-foreground">{upholdPct.toFixed(0)}%</span>
            </div>
            <Progress value={upholdPct} className="h-2 bg-muted" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium"><ThumbsDown className="h-4 w-4 text-red-500" />Reject ({votes.reject})</span>
              <span className="text-muted-foreground">{rejectPct.toFixed(0)}%</span>
            </div>
            <Progress value={rejectPct} className="h-2 bg-muted" />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Progress value={participation} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground shrink-0">{totalVotes}/{votes.totalMembers ?? "?"} voted</span>
          </div>
        </div>

        {/* Vote buttons */}
        {isOpen && !userVoted && (
          <div className="flex gap-2 pt-2">
            <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" disabled={loading} onClick={() => handleVote("UPHOLD")}>
              <ThumbsUp className="h-4 w-4" />Uphold
            </Button>
            <Button className="flex-1 gap-2" variant="destructive" disabled={loading} onClick={() => handleVote("REJECT")}>
              <ThumbsDown className="h-4 w-4" />Reject
            </Button>
          </div>
        )}

        {userVoted && isOpen && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">Your anonymous vote has been recorded.</AlertDescription>
          </Alert>
        )}

        {isResolved && (
          <Alert className={resolvedOutcome === "UPHELD" ? "border-green-200 bg-green-50 dark:bg-green-950/20" : "border-red-200 bg-red-50 dark:bg-red-950/20"}>
            {resolvedOutcome === "UPHELD"
              ? <CheckCircle2 className="h-4 w-4 text-green-600" />
              : <XCircle className="h-4 w-4 text-red-500" />}
            <AlertDescription className={resolvedOutcome === "UPHELD" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
              Dispute {resolvedOutcome === "UPHELD" ? "upheld" : "rejected"} by member vote — {totalVotes} votes cast ({participation}% participation).
            </AlertDescription>
          </Alert>
        )}

        {isExpired && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>The 72-hour voting window has closed without reaching 60% quorum.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
