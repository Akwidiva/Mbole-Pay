import { useState, useCallback, useEffect } from "react";

export type GroupMetrics = {
  groupId: string;
  groupName: string;
  totalMembers: number;
  activeMembers: number;
  totalContributed: number;
  totalPaidOut: number;
  pendingAmount: number;
  defaultRate: number;
  participationRate: number;
  contributionTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  paymentBreakdown: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  topContributors: Array<{
    userId: string;
    userName: string;
    totalContributed: number;
    contributionCount: number;
  }>;
  memberStats: Array<{
    userId: string;
    userName: string;
    email: string;
    totalContributed: number;
    participationRate: number;
    lastContributionDate: Date | null;
    status: "active" | "inactive" | "defaulted";
  }>;
  nextPayoutDate: Date | null;
  nextPayoutAmount: number | null;
  cycleStartDate: Date | null;
  cycleEndDate: Date | null;
};

export type UseAnalyticsReturn = {
  metrics: GroupMetrics | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  exportToCSV: () => void;
  exportToPDF: () => void;
};

export function useAnalytics(groupId: string): UseAnalyticsReturn {
  const [metrics, setMetrics] = useState<GroupMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/groups/${groupId}/analytics`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "Failed to fetch analytics");
      }

      const data = await response.json();
      setMetrics(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const exportToCSV = useCallback(() => {
    if (!metrics) return;

    // Create CSV content
    const rows: string[] = [];

    // Header
    rows.push("Mbole Pay - Group Analytics Report");
    rows.push(`Group: ${metrics.groupName}`);
    rows.push(`Generated: ${new Date().toLocaleString()}`);
    rows.push("");

    // Summary metrics
    rows.push("SUMMARY METRICS");
    rows.push("Metric,Value");
    rows.push(`Total Members,${metrics.totalMembers}`);
    rows.push(`Active Members,${metrics.activeMembers}`);
    rows.push(`Total Contributed,${metrics.totalContributed}`);
    rows.push(`Total Paid Out,${metrics.totalPaidOut}`);
    rows.push(`Pending Amount,${metrics.pendingAmount}`);
    rows.push(`Default Rate,${metrics.defaultRate}%`);
    rows.push(`Participation Rate,${metrics.participationRate}%`);
    rows.push("");

    // Contribution trend
    rows.push("CONTRIBUTION TREND (Last 12 Months)");
    rows.push("Month,Amount,Count");
    metrics.contributionTrend.forEach((t) => {
      rows.push(`${t.month},${t.amount},${t.count}`);
    });
    rows.push("");

    // Payment breakdown
    rows.push("PAYMENT BREAKDOWN");
    rows.push("Method,Count,Amount");
    metrics.paymentBreakdown.forEach((p) => {
      rows.push(`${p.method},${p.count},${p.amount}`);
    });
    rows.push("");

    // Top contributors
    rows.push("TOP CONTRIBUTORS");
    rows.push("Name,Total Contributed,Contribution Count");
    metrics.topContributors.forEach((c) => {
      rows.push(`${c.userName},${c.totalContributed},${c.contributionCount}`);
    });
    rows.push("");

    // Member stats
    rows.push("MEMBER STATISTICS");
    rows.push("Name,Email,Total Contributed,Participation Rate,Last Contribution,Status");
    metrics.memberStats.forEach((m) => {
      const lastContribution = m.lastContributionDate
        ? new Date(m.lastContributionDate).toLocaleDateString()
        : "Never";
      rows.push(
        `${m.userName},${m.email},${m.totalContributed},${m.participationRate}%,${lastContribution},${m.status}`
      );
    });

    // Create and download file
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${metrics.groupName}-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [metrics]);

  const exportToPDF = useCallback(() => {
    if (!metrics) return;

    // For PDF export, we would typically use a library like jsPDF or pdfkit
    // For now, we'll provide a simplified implementation
    let content = "MBOLE PAY - GROUP ANALYTICS REPORT\n\n";
    content += `Group: ${metrics.groupName}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n\n`;

    content += "=== SUMMARY METRICS ===\n";
    content += `Total Members: ${metrics.totalMembers}\n`;
    content += `Active Members: ${metrics.activeMembers}\n`;
    content += `Total Contributed: ${metrics.totalContributed}\n`;
    content += `Total Paid Out: ${metrics.totalPaidOut}\n`;
    content += `Pending Amount: ${metrics.pendingAmount}\n`;
    content += `Default Rate: ${metrics.defaultRate}%\n`;
    content += `Participation Rate: ${metrics.participationRate}%\n\n`;

    content += "=== TOP CONTRIBUTORS ===\n";
    metrics.topContributors.forEach((c) => {
      content += `${c.userName}: ${c.totalContributed} (${c.contributionCount} contributions)\n`;
    });

    content += "\n=== MEMBER STATISTICS ===\n";
    metrics.memberStats.forEach((m) => {
      content += `${m.userName} (${m.email}): ${m.totalContributed} contributed, Status: ${m.status}\n`;
    });

    // Create and download file
    const blob = new Blob([content], {
      type: "application/pdf;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${metrics.groupName}-analytics-${new Date().toISOString().slice(0, 10)}.pdf`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [metrics]);

  return {
    metrics,
    loading,
    error,
    refetch,
    exportToCSV,
    exportToPDF,
  };
}
