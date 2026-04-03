/**
 * PDF Export Service
 * Generates PDF reports with financial data
 */

import {
  GroupFinancialSummary,
  IndividualStatement,
  AnalyticsData,
  PdfReportData,
} from "@/types/reports";

export class PdfExportService {
  /**
   * Generate PDF data for group financial summary
   */
  generateGroupSummaryPdf(summary: GroupFinancialSummary): PdfReportData {
    const sections = [
      {
        title: "GROUP FINANCIAL SUMMARY",
        content: summary.groupName,
        type: "text" as const,
      },
      {
        title: "Report Generated",
        content: summary.generatedAt.toLocaleString(),
        type: "text" as const,
      },
      {
        title: "Group Information",
        content: `Name: ${summary.groupName}\nMembers: ${summary.totalMembers}\nFrequency: ${summary.frequency}\nContribution Amount: ${summary.contributionAmount} ${summary.currency}`,
        type: "text" as const,
      },
      {
        title: "Financial Summary",
        content: this.formatFinancialStats(summary.stats, summary.currency),
        type: "table" as const,
      },
      {
        title: "Contribution Details",
        content: this.formatContributionTable(summary.contributions),
        type: "table" as const,
      },
    ];

    return {
      params: {
        title: `Group Financial Report - ${summary.groupName}`,
        generatedBy: "Mbole Pay",
        generatedAt: new Date(),
        period: {
          startDate: new Date(0),
          endDate: new Date(),
        },
      },
      content: { sections },
    };
  }

  /**
   * Generate PDF data for individual statement
   */
  generateIndividualStatementPdf(
    statement: IndividualStatement
  ): PdfReportData {
    const sections = [
      {
        title: "INDIVIDUAL CONTRIBUTION STATEMENT",
        content: statement.userName,
        type: "text" as const,
      },
      {
        title: "Statement Date",
        content: statement.generatedAt.toLocaleString(),
        type: "text" as const,
      },
      {
        title: "Personal Information",
        content: `Name: ${statement.userName}\nEmail: ${statement.email}\nPhone: ${statement.phone || "N/A"}\nGroups: ${statement.groups.length}`,
        type: "text" as const,
      },
      {
        title: "Overall Statistics",
        content: this.formatFinancialStats(statement.totalStats, "XAF"),
        type: "table" as const,
      },
      {
        title: "Group Breakdown",
        content: this.formatGroupBreakdown(statement.groups),
        type: "table" as const,
      },
    ];

    return {
      params: {
        title: `Individual Contribution Statement - ${statement.userName}`,
        generatedBy: "Mbole Pay",
        generatedAt: new Date(),
        period: {
          startDate: new Date(0),
          endDate: new Date(),
        },
      },
      content: { sections },
    };
  }

  /**
   * Generate PDF data for analytics
   */
  generateAnalyticsPdf(analytics: AnalyticsData): PdfReportData {
    const sections = [
      {
        title: "FINANCIAL ANALYTICS REPORT",
        content: "System-wide Financial Overview",
        type: "text" as const,
      },
      {
        title: "Report Period",
        content: `${analytics.period.startDate.toLocaleDateString()} - ${analytics.period.endDate.toLocaleDateString()}`,
        type: "text" as const,
      },
      {
        title: "Financial Summary",
        content: JSON.stringify(
          {
            Revenue: `${analytics.totals.revenue} XAF`,
            "Net Profit": `${analytics.totals.netProfit} XAF`,
            "Average Transaction": `${analytics.totals.averageTransaction.toFixed(2)} XAF`,
          },
          null,
          2
        ),
        type: "text" as const,
      },
      {
        title: "Status Breakdown",
        content: this.formatStatusBreakdown(analytics.byStatus),
        type: "table" as const,
      },
      {
        title: "Group Performance",
        content: this.formatGroupPerformance(analytics.byGroup),
        type: "table" as const,
      },
    ];

    return {
      params: {
        title: "Financial Analytics Report",
        generatedBy: "Mbole Pay",
        generatedAt: new Date(),
        period: analytics.period,
      },
      content: { sections },
    };
  }

  /**
   * Format financial stats as readable text
   */
  private formatFinancialStats(
    stats: any,
    currency: string
  ): string {
    return `
Total Contributions: ${stats.totalContributions}
Total Amount: ${stats.totalAmount} ${currency}
Paid: ${stats.totalPaid} (${stats.paidAmount} ${currency})
Pending: ${stats.totalPending} (${stats.pendingAmount} ${currency})
Overdue: ${stats.totalOverdue} (${stats.overdueAmount} ${currency})
Average Contribution: ${stats.averageContribution.toFixed(2)} ${currency}
Completion Rate: ${stats.completionRate.toFixed(2)}%
    `.trim();
  }

  /**
   * Format contribution table
   */
  private formatContributionTable(contributions: any[]): string {
    const headers = [
      "Contributor",
      "Amount",
      "Status",
      "Due Date",
      "Paid Date",
    ];
    const rows = contributions.map((c) => [
      c.userName,
      c.amount,
      c.status,
      c.dueDate.toLocaleDateString(),
      c.paidAt?.toLocaleDateString() || "N/A",
    ]);

    return this.formatTable(headers, rows);
  }

  /**
   * Format group breakdown
   */
  private formatGroupBreakdown(groups: any[]): string {
    const headers = ["Group", "Total Paid", "Pending", "Completion Rate"];
    const rows = groups.map((g) => [
      g.groupName,
      g.stats.paidAmount,
      g.stats.pendingAmount,
      `${g.stats.completionRate.toFixed(2)}%`,
    ]);

    return this.formatTable(headers, rows);
  }

  /**
   * Format status breakdown
   */
  private formatStatusBreakdown(byStatus: any): string {
    const rows = [
      ["Paid", byStatus.paid.count, byStatus.paid.amount],
      ["Pending", byStatus.pending.count, byStatus.pending.amount],
      ["Overdue", byStatus.overdue.count, byStatus.overdue.amount],
    ];

    return this.formatTable(["Status", "Count", "Amount"], rows);
  }

  /**
   * Format group performance
   */
  private formatGroupPerformance(groups: any[]): string {
    const headers = ["Group", "Total Amount", "Members", "Completion"];
    const rows = groups.map((g) => [
      g.groupName,
      g.totalAmount,
      g.memberCount,
      `${g.completionRate.toFixed(2)}%`,
    ]);

    return this.formatTable(headers, rows);
  }

  /**
   * Format table as text
   */
  private formatTable(headers: string[], rows: any[][]): string {
    const columnWidths = headers.map((h) => h.length);

    // Calculate column widths
    rows.forEach((row) => {
      row.forEach((cell, idx) => {
        const cellLength = String(cell).length;
        columnWidths[idx] = Math.max(columnWidths[idx], cellLength);
      });
    });

    // Format header
    let table = headers
      .map((h, i) => h.padEnd(columnWidths[i]))
      .join(" | ");
    table += "\n";
    table += columnWidths.map((w) => "-".repeat(w)).join("-+-");
    table += "\n";

    // Format rows
    rows.forEach((row) => {
      table += row
        .map((cell, i) => String(cell).padEnd(columnWidths[i]))
        .join(" | ");
      table += "\n";
    });

    return table;
  }

  /**
   * Convert PDF data to HTML for rendering/printing
   */
  toHTML(pdfData: PdfReportData): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${pdfData.params.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; }
    h2 { color: #555; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    .section { page-break-inside: avoid; margin: 20px 0; }
    .summary { background-color: #f9f9f9; padding: 10px; border-radius: 4px; }
    pre { background-color: #f5f5f5; padding: 10px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${pdfData.params.title}</h1>
  <p><strong>Generated:</strong> ${pdfData.params.generatedAt.toLocaleString()}</p>
  <p><strong>By:</strong> ${pdfData.params.generatedBy}</p>
  
  ${pdfData.content.sections
    .map((section) => {
      if (section.type === "text") {
        return `
    <div class="section">
      <h2>${section.title}</h2>
      <pre>${section.content}</pre>
    </div>
        `;
      } else if (section.type === "table") {
        return `
    <div class="section">
      <h2>${section.title}</h2>
      <pre>${section.content}</pre>
    </div>
        `;
      }
      return "";
    })
    .join("")}
</body>
</html>
    `;

    return html;
  }

  /**
   * Convert PDF data to plain text format
   */
  toText(pdfData: PdfReportData): string {
    let text = "";
    text += "=".repeat(80) + "\n";
    text += pdfData.params.title.toUpperCase() + "\n";
    text += "=".repeat(80) + "\n\n";

    text += `Generated: ${pdfData.params.generatedAt.toLocaleString()}\n`;
    text += `Period: ${pdfData.params.period.startDate.toLocaleDateString()} - ${pdfData.params.period.endDate.toLocaleDateString()}\n`;
    text += `By: ${pdfData.params.generatedBy}\n\n`;

    pdfData.content.sections.forEach((section) => {
      text += section.title.toUpperCase() + "\n";
      text += "-".repeat(section.title.length) + "\n";
      text += section.content + "\n\n";
    });

    return text;
  }
}

// Singleton instance
let pdfServiceInstance: PdfExportService | null = null;

/**
 * Get or create PDF export service instance
 */
export function getPdfExportService(): PdfExportService {
  if (!pdfServiceInstance) {
    pdfServiceInstance = new PdfExportService();
  }
  return pdfServiceInstance;
}

export default PdfExportService;
