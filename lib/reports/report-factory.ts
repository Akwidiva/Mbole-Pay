/**
 * Report Factory Service
 * Coordinates report generation across all services
 */

import { getAnalyticsService } from "./analytics-service";
import { getExcelExportService } from "./excel-export-service";
import { getPdfExportService } from "./pdf-export-service";
import {
  ReportType,
  ExportFormat,
  ReportOptions,
  ReportGenerationResult,
  DateRangeType,
} from "@/types/reports";

export class ReportFactory {
  /**
   * Generate a report based on options
   */
  async generateReport(
    options: ReportOptions
  ): Promise<ReportGenerationResult> {
    const startTime = Date.now();

    try {
      console.log(`📊 Generating ${options.reportType} report in ${options.format} format`);

      let reportData: any;
      const analyticsService = getAnalyticsService();

      // Get date range
      const dateRange = options.dateRange
        ? analyticsService.getDateRange(options.dateRange)
        : {
            startDate: options.startDate,
            endDate: options.endDate,
          };

      // Generate report data based on type
      switch (options.reportType) {
        case ReportType.GROUP_SUMMARY:
          if (!options.groupId) {
            throw new Error("groupId required for GROUP_SUMMARY report");
          }
          reportData = await analyticsService.getGroupFinancialSummary(
            options.groupId,
            dateRange.startDate,
            dateRange.endDate
          );
          break;

        case ReportType.INDIVIDUAL_STATEMENT:
          if (!options.userId) {
            throw new Error("userId required for INDIVIDUAL_STATEMENT report");
          }
          reportData = await analyticsService.getIndividualStatement(
            options.userId,
            dateRange.startDate,
            dateRange.endDate
          );
          break;

        case ReportType.CONTRIBUTION_HISTORY:
          if (!options.groupId && !options.userId) {
            throw new Error(
              "groupId or userId required for CONTRIBUTION_HISTORY report"
            );
          }
          reportData = await analyticsService.getGroupFinancialSummary(
            options.groupId || "",
            dateRange.startDate,
            dateRange.endDate
          );
          break;

        case ReportType.FINANCIAL_STATEMENT:
          reportData = await analyticsService.getAnalyticsData(
            options.groupId,
            dateRange.startDate,
            dateRange.endDate
          );
          break;

        default:
          throw new Error(`Unknown report type: ${options.reportType}`);
      }

      // Export based on format
      let fileData: Buffer | string;
      let fileName: string;

      switch (options.format) {
        case ExportFormat.EXCEL:
          fileData = await this.exportToExcel(options.reportType, reportData);
          fileName = `${options.reportType}_${Date.now()}.xlsx`;
          break;

        case ExportFormat.PDF:
          fileData = await this.exportToPdf(options.reportType, reportData);
          fileName = `${options.reportType}_${Date.now()}.pdf`;
          break;

        case ExportFormat.CSV:
          fileData = await this.exportToCsv(options.reportType, reportData);
          fileName = `${options.reportType}_${Date.now()}.csv`;
          break;

        case ExportFormat.JSON:
          fileData = JSON.stringify(reportData, null, 2);
          fileName = `${options.reportType}_${Date.now()}.json`;
          break;

        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      const duration = Date.now() - startTime;

      console.log(
        `✅ Report generated successfully (${duration}ms, ${fileData.length} bytes)`
      );

      return {
        success: true,
        reportType: options.reportType,
        format: options.format,
        fileName,
        fileSize: fileData.length,
        generatedAt: new Date(),
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error("❌ Report generation failed:", error);

      return {
        success: false,
        reportType: options.reportType,
        format: options.format,
        fileName: "",
        fileSize: 0,
        generatedAt: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      };
    }
  }

  /**
   * Export to Excel format
   */
  private async exportToExcel(
    reportType: ReportType,
    data: any
  ): Promise<string> {
    const excelService = getExcelExportService();

    let excelData;

    switch (reportType) {
      case ReportType.GROUP_SUMMARY:
        excelData = excelService.generateGroupSummaryExcel(data);
        break;
      case ReportType.INDIVIDUAL_STATEMENT:
        excelData = excelService.generateIndividualStatementExcel(data);
        break;
      case ReportType.FINANCIAL_STATEMENT:
        excelData = excelService.generateAnalyticsExcel(data);
        break;
      default:
        throw new Error(`Cannot export ${reportType} to Excel`);
    }

    // For now, return CSV format (Excel compatible)
    // TODO: Implement proper XLSX export with exceljs library
    return excelService.convertToCSV(excelData);
  }

  /**
   * Export to PDF format
   */
  private async exportToPdf(
    reportType: ReportType,
    data: any
  ): Promise<string> {
    const pdfService = getPdfExportService();

    let pdfData;

    switch (reportType) {
      case ReportType.GROUP_SUMMARY:
        pdfData = pdfService.generateGroupSummaryPdf(data);
        break;
      case ReportType.INDIVIDUAL_STATEMENT:
        pdfData = pdfService.generateIndividualStatementPdf(data);
        break;
      case ReportType.FINANCIAL_STATEMENT:
        pdfData = pdfService.generateAnalyticsPdf(data);
        break;
      default:
        throw new Error(`Cannot export ${reportType} to PDF`);
    }

    // For now, return HTML
    // TODO: Implement proper PDF export with pdfkit or html2pdf library
    return pdfService.toHTML(pdfData);
  }

  /**
   * Export to CSV format
   */
  private async exportToCsv(
    reportType: ReportType,
    data: any
  ): Promise<string> {
    const excelService = getExcelExportService();

    let excelData;

    switch (reportType) {
      case ReportType.GROUP_SUMMARY:
        excelData = excelService.generateGroupSummaryExcel(data);
        break;
      case ReportType.INDIVIDUAL_STATEMENT:
        excelData = excelService.generateIndividualStatementExcel(data);
        break;
      case ReportType.FINANCIAL_STATEMENT:
        excelData = excelService.generateAnalyticsExcel(data);
        break;
      default:
        throw new Error(`Cannot export ${reportType} to CSV`);
    }

    return excelService.convertToCSV(excelData);
  }

  /**
   * Get report preview (JSON format)
   */
  async getReportPreview(options: ReportOptions): Promise<any> {
    try {
      const analyticsService = getAnalyticsService();

      const dateRange = options.dateRange
        ? analyticsService.getDateRange(options.dateRange)
        : {
            startDate: options.startDate,
            endDate: options.endDate,
          };

      switch (options.reportType) {
        case ReportType.GROUP_SUMMARY:
          return await analyticsService.getGroupFinancialSummary(
            options.groupId!,
            dateRange.startDate,
            dateRange.endDate
          );
        case ReportType.INDIVIDUAL_STATEMENT:
          return await analyticsService.getIndividualStatement(
            options.userId!,
            dateRange.startDate,
            dateRange.endDate
          );
        case ReportType.FINANCIAL_STATEMENT:
          return await analyticsService.getAnalyticsData(
            options.groupId,
            dateRange.startDate,
            dateRange.endDate
          );
        default:
          throw new Error(`Unknown report type: ${options.reportType}`);
      }
    } catch (error) {
      console.error("Error getting report preview:", error);
      throw error;
    }
  }

  /**
   * Get available reports for a group
   */
  getAvailableReports(): Array<{
    type: ReportType;
    name: string;
    description: string;
    formats: ExportFormat[];
  }> {
    return [
      {
        type: ReportType.GROUP_SUMMARY,
        name: "Group Financial Summary",
        description: "Complete financial overview of a group",
        formats: [
          ExportFormat.PDF,
          ExportFormat.EXCEL,
          ExportFormat.CSV,
          ExportFormat.JSON,
        ],
      },
      {
        type: ReportType.CONTRIBUTION_HISTORY,
        name: "Contribution History",
        description: "Detailed contribution records over time",
        formats: [
          ExportFormat.PDF,
          ExportFormat.EXCEL,
          ExportFormat.CSV,
          ExportFormat.JSON,
        ],
      },
      {
        type: ReportType.INDIVIDUAL_STATEMENT,
        name: "Individual Contribution Statement",
        description: "Personal contribution summary across groups",
        formats: [
          ExportFormat.PDF,
          ExportFormat.EXCEL,
          ExportFormat.CSV,
          ExportFormat.JSON,
        ],
      },
      {
        type: ReportType.FINANCIAL_STATEMENT,
        name: "Financial Statement",
        description: "System-wide financial overview and analytics",
        formats: [
          ExportFormat.PDF,
          ExportFormat.EXCEL,
          ExportFormat.CSV,
          ExportFormat.JSON,
        ],
      },
      {
        type: ReportType.PAYMENT_SUMMARY,
        name: "Payment Summary",
        description: "Payment and payout records",
        formats: [
          ExportFormat.PDF,
          ExportFormat.EXCEL,
          ExportFormat.CSV,
          ExportFormat.JSON,
        ],
      },
      {
        type: ReportType.PAYOUT_SCHEDULE,
        name: "Payout Schedule",
        description: "Future payout dates and recipients",
        formats: [
          ExportFormat.PDF,
          ExportFormat.EXCEL,
          ExportFormat.CSV,
          ExportFormat.JSON,
        ],
      },
    ];
  }
}

// Singleton instance
let reportFactoryInstance: ReportFactory | null = null;

/**
 * Get or create report factory instance
 */
export function getReportFactory(): ReportFactory {
  if (!reportFactoryInstance) {
    reportFactoryInstance = new ReportFactory();
  }
  return reportFactoryInstance;
}

export default ReportFactory;
