/**
 * Financial Reporting Types & Interfaces
 * Defines all report-related types and enumerations
 */

// Report types
export enum ReportType {
  GROUP_SUMMARY = "GROUP_SUMMARY",
  CONTRIBUTION_HISTORY = "CONTRIBUTION_HISTORY",
  PAYMENT_SUMMARY = "PAYMENT_SUMMARY",
  INDIVIDUAL_STATEMENT = "INDIVIDUAL_STATEMENT",
  FINANCIAL_STATEMENT = "FINANCIAL_STATEMENT",
  PAYOUT_SCHEDULE = "PAYOUT_SCHEDULE",
}

// Export formats
export enum ExportFormat {
  PDF = "pdf",
  EXCEL = "excel",
  CSV = "csv",
  JSON = "json",
}

// Report date ranges
export enum DateRangeType {
  THIS_MONTH = "THIS_MONTH",
  LAST_MONTH = "LAST_MONTH",
  THIS_QUARTER = "THIS_QUARTER",
  THIS_YEAR = "THIS_YEAR",
  LAST_30_DAYS = "LAST_30_DAYS",
  LAST_90_DAYS = "LAST_90_DAYS",
  ALL_TIME = "ALL_TIME",
  CUSTOM = "CUSTOM",
}

// Report generation options
export interface ReportOptions {
  groupId?: string;
  userId?: string;
  reportType: ReportType;
  format: ExportFormat;
  dateRange?: DateRangeType;
  startDate?: Date;
  endDate?: Date;
  includeCharts?: boolean;
  currency?: string;
}

// Financial statistics
export interface FinancialStats {
  totalContributions: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageContribution: number;
  completionRate: number; // percentage 0-100
}

// Contribution record for reports
export interface ContributionRecord {
  id: string;
  userId: string;
  userName: string;
  contributorPhone?: string;
  groupId: string;
  groupName: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  dueDate: Date;
  paidAt?: Date;
  daysOverdue?: number;
  createdAt: Date;
}

// Payment record for reports
export interface PaymentRecord {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  reference?: string;
  createdAt: Date;
}

// Group financial summary
export interface GroupFinancialSummary {
  groupId: string;
  groupName: string;
  description?: string;
  totalMembers: number;
  frequency: string;
  contributionAmount: number;
  currency: string;
  stats: FinancialStats;
  contributions: ContributionRecord[];
  generatedAt: Date;
}

// Individual statement
export interface IndividualStatement {
  userId: string;
  userName: string;
  email: string;
  phone?: string;
  groups: Array<{
    groupId: string;
    groupName: string;
    role: string;
    stats: FinancialStats;
    recentContributions: ContributionRecord[];
  }>;
  totalStats: FinancialStats;
  generatedAt: Date;
}

// Report parameters
export interface ReportParams {
  title: string;
  description?: string;
  generatedBy: string;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metadata?: Record<string, any>;
}

// PDF report data
export interface PdfReportData {
  params: ReportParams;
  content: {
    sections: Array<{
      title: string;
      content: string | number | boolean;
      type: "text" | "number" | "table" | "chart";
    }>;
  };
}

// Excel report data
export interface ExcelReportData {
  sheetName: string;
  columns: Array<{
    header: string;
    key: string;
    width: number;
  }>;
  rows: Array<Record<string, any>>;
  summary?: Record<string, number | string>;
}

// Report generation response
export interface ReportGenerationResult {
  success: boolean;
  reportType: ReportType;
  format: ExportFormat;
  fileName: string;
  fileSize: number;
  generatedAt: Date;
  downloadUrl?: string;
  error?: string;
  duration: number; // milliseconds
}

// Analytics data
export interface AnalyticsData {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totals: {
    revenue: number;
    expenses: number;
    netProfit: number;
    averageTransaction: number;
  };
  byStatus: {
    paid: { count: number; amount: number };
    pending: { count: number; amount: number };
    overdue: { count: number; amount: number };
  };
  byGroup: Array<{
    groupId: string;
    groupName: string;
    totalAmount: number;
    memberCount: number;
    completionRate: number;
  }>;
  trends: Array<{
    date: Date;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
  }>;
}

// Chart data
export interface ChartData {
  type: "line" | "bar" | "pie" | "doughnut";
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }>;
}
