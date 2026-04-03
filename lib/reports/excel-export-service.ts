/**
 * Excel Export Service
 * Generates Excel files with financial reports
 */

import {
  GroupFinancialSummary,
  IndividualStatement,
  AnalyticsData,
  ExcelReportData,
  ReportGenerationResult,
} from "@/types/reports";

export class ExcelExportService {
  /**
   * Generate Excel data for group financial summary
   */
  generateGroupSummaryExcel(
    summary: GroupFinancialSummary
  ): ExcelReportData {
    const columns = [
      { header: "Contributor", key: "contributor", width: 20 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Paid Date", key: "paidDate", width: 15 },
      { header: "Days Overdue", key: "daysOverdue", width: 12 },
    ];

    const rows = summary.contributions.map((contrib) => ({
      contributor: contrib.userName,
      amount: `${contrib.amount} ${contrib.currency}`,
      status: contrib.status,
      dueDate: contrib.dueDate.toLocaleDateString(),
      paidDate: contrib.paidAt?.toLocaleDateString() || "N/A",
      daysOverdue: contrib.daysOverdue || "N/A",
    }));

    return {
      sheetName: "Contributions",
      columns,
      rows,
      summary: {
        "Group Name": summary.groupName,
        "Total Members": summary.totalMembers,
        "Frequency": summary.frequency,
        "Total Contributions": summary.stats.totalContributions,
        "Total Amount": `${summary.stats.totalAmount} ${summary.currency}`,
        "Paid Amount": `${summary.stats.paidAmount} ${summary.currency}`,
        "Pending Amount": `${summary.stats.pendingAmount} ${summary.currency}`,
        "Overdue Amount": `${summary.stats.overdueAmount} ${summary.currency}`,
        "Completion Rate": `${summary.stats.completionRate.toFixed(2)}%`,
      },
    };
  }

  /**
   * Generate Excel data for individual statement
   */
  generateIndividualStatementExcel(
    statement: IndividualStatement
  ): ExcelReportData {
    const allContributions: any[] = [];

    statement.groups.forEach((group) => {
      group.recentContributions.forEach((contrib) => {
        allContributions.push({
          group: group.groupName,
          amount: `${contrib.amount} XAF`,
          status: contrib.status,
          dueDate: contrib.dueDate.toLocaleDateString(),
          paidDate: contrib.paidAt?.toLocaleDateString() || "N/A",
        });
      });
    });

    const columns = [
      { header: "Group", key: "group", width: 20 },
      { header: "Amount", key: "amount", width: 12 },
      { header: "Status", key: "status", width: 12 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Paid Date", key: "paidDate", width: 15 },
    ];

    return {
      sheetName: "Statement",
      columns,
      rows: allContributions,
      summary: {
        "User": statement.userName,
        "Email": statement.email,
        "Groups": statement.groups.length,
        "Total Contributions": statement.totalStats.totalContributions,
        "Total Paid": `${statement.totalStats.paidAmount} XAF`,
        "Total Pending": `${statement.totalStats.pendingAmount} XAF`,
        "Total Overdue": `${statement.totalStats.overdueAmount} XAF`,
        "Completion Rate": `${statement.totalStats.completionRate.toFixed(2)}%`,
      },
    };
  }

  /**
   * Generate Excel data for analytics
   */
  generateAnalyticsExcel(analytics: AnalyticsData): ExcelReportData {
    const rows = analytics.byGroup.map((group) => ({
      groupName: group.groupName,
      totalAmount: `${group.totalAmount} XAF`,
      members: group.memberCount,
      completionRate: `${group.completionRate.toFixed(2)}%`,
    }));

    const columns = [
      { header: "Group Name", key: "groupName", width: 25 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Members", key: "members", width: 10 },
      { header: "Completion Rate", key: "completionRate", width: 15 },
    ];

    return {
      sheetName: "Analytics",
      columns,
      rows,
      summary: {
        "Period": `${analytics.period.startDate.toLocaleDateString()} - ${analytics.period.endDate.toLocaleDateString()}`,
        "Total Revenue": `${analytics.totals.revenue} XAF`,
        "Total Paid": analytics.byStatus.paid.count,
        "Total Pending": analytics.byStatus.pending.count,
        "Total Overdue": analytics.byStatus.overdue.count,
        "Average Transaction": `${analytics.totals.averageTransaction.toFixed(2)} XAF`,
      },
    };
  }

  /**
   * Convert Excel data to CSV format (for browsers without xlsx dependency)
   */
  convertToCSV(excelData: ExcelReportData): string {
    let csv = "";

    // Add summary section
    if (excelData.summary) {
      csv += "SUMMARY\n";
      Object.entries(excelData.summary).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
      csv += "\n";
    }

    // Add column headers
    csv += excelData.columns.map((col) => col.header).join(",") + "\n";

    // Add rows
    excelData.rows.forEach((row) => {
      csv +=
        excelData.columns
          .map((col) => {
            const value = row[col.key];
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value || "");
            return stringValue.includes(",")
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          })
          .join(",") + "\n";
    });

    return csv;
  }

  /**
   * Convert report data to structured JSON for API responses
   */
  toJSON(excelData: ExcelReportData): Record<string, any> {
    return {
      sheet: excelData.sheetName,
      columns: excelData.columns,
      data: excelData.rows,
      summary: excelData.summary,
      generatedAt: new Date().toISOString(),
    };
  }
}

// Singleton instance
let excelServiceInstance: ExcelExportService | null = null;

/**
 * Get or create Excel export service instance
 */
export function getExcelExportService(): ExcelExportService {
  if (!excelServiceInstance) {
    excelServiceInstance = new ExcelExportService();
  }
  return excelServiceInstance;
}

export default ExcelExportService;
