"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisputeForm, DisputeHistory } from "@/components/disputes";

interface DisputesPageProps {
  groupId: string;
  groupName?: string;
  userRole?: string;
}

export function DisputesPage({ groupId, groupName = "Group", userRole = "MEMBER" }: DisputesPageProps) {
  const [disputeCount, setDisputeCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dispute Resolution</h2>
          <p className="text-muted-foreground mt-1">
            Vote fairly to resolve group disputes transparently
          </p>
        </div>
        <Badge variant="outline">{disputeCount} Active</Badge>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            ⚖️ Fair & Transparent Voting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-blue-900">
            <li>✓ File disputes with detailed descriptions</li>
            <li>✓ All members vote anonymously</li>
            <li>✓ Majority vote decides outcome</li>
            <li>✓ Full transparency - see all votes & results</li>
          </ul>
        </CardContent>
      </Card>

      {/* File Dispute Button */}
      <div className="flex justify-end">
        <DisputeForm groupId={groupId} onDisputeFiled={() => setRefreshTrigger(t => t + 1)} />
      </div>

      {/* Disputes List */}
      <DisputeHistory
        groupId={groupId}
        refreshTrigger={refreshTrigger}
        onDisputesLoaded={(count) => setDisputeCount(count)}
      />
    </div>
  );
}
