/**
 * Report Builder Component
 * UI for generating financial reports
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ReportType, ExportFormat, DateRangeType } from "@/types/reports";
import { useToast } from "@/hooks/use-toast";

interface ReportBuilderProps {
  groupId?: string;
  userId?: string;
  onReportGenerated?: (fileName: string) => void;
}

export function ReportBuilder({
  groupId,
  userId,
  onReportGenerated,
}: ReportBuilderProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>(ReportType.GROUP_SUMMARY);
  const [format, setFormat] = useState<ExportFormat>(ExportFormat.PDF);
  const [dateRange, setDateRange] = useState<DateRangeType>(DateRangeType.THIS_MONTH);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleGenerateReport = async () => {
    try {
      setLoading(true);

      const payload: any = {
        reportType,
        format,
      };

      // Add optional fields if provided
      if (groupId) payload.groupId = groupId;
      if (userId) payload.userId = userId;

      // Handle date range
      if (dateRange === DateRangeType.CUSTOM) {
        if (!startDate || !endDate) {
          toast({
            title: "Error",
            description: "Please select both start and end dates for custom range",
            variant: "destructive",
          });
          return;
        }
        payload.startDate = startDate;
        payload.endDate = endDate;
      } else {
        payload.dateRange = dateRange;
      }

      console.log("Generating report:", payload);

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to generate report",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Report generated: ${data.fileName} (${data.fileSize} bytes)`,
      });

      if (onReportGenerated) {
        onReportGenerated(data.fileName);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Financial Report</CardTitle>
        <CardDescription>
          Create and export financial reports in multiple formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type */}
        <div className="space-y-2">
          <Label htmlFor="report-type">Report Type</Label>
          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger id="report-type">
              <SelectValue placeholder="Select report type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ReportType.GROUP_SUMMARY}>
                Group Financial Summary
              </SelectItem>
              <SelectItem value={ReportType.INDIVIDUAL_STATEMENT}>
                Individual Statement
              </SelectItem>
              <SelectItem value={ReportType.CONTRIBUTION_HISTORY}>
                Contribution History
              </SelectItem>
              <SelectItem value={ReportType.FINANCIAL_STATEMENT}>
                Financial Statement
              </SelectItem>
              <SelectItem value={ReportType.PAYMENT_SUMMARY}>Payment Summary</SelectItem>
              <SelectItem value={ReportType.PAYOUT_SCHEDULE}>Payout Schedule</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export Format */}
        <div className="space-y-2">
          <Label htmlFor="export-format">Export Format</Label>
          <Select value={format} onValueChange={(value: any) => setFormat(value)}>
            <SelectTrigger id="export-format">
              <SelectValue placeholder="Select format..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ExportFormat.PDF}>PDF</SelectItem>
              <SelectItem value={ExportFormat.EXCEL}>Excel</SelectItem>
              <SelectItem value={ExportFormat.CSV}>CSV</SelectItem>
              <SelectItem value={ExportFormat.JSON}>JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label htmlFor="date-range">Date Range</Label>
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger id="date-range">
              <SelectValue placeholder="Select date range..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DateRangeType.THIS_MONTH}>This Month</SelectItem>
              <SelectItem value={DateRangeType.LAST_MONTH}>Last Month</SelectItem>
              <SelectItem value={DateRangeType.THIS_QUARTER}>This Quarter</SelectItem>
              <SelectItem value={DateRangeType.THIS_YEAR}>This Year</SelectItem>
              <SelectItem value={DateRangeType.LAST_30_DAYS}>Last 30 Days</SelectItem>
              <SelectItem value={DateRangeType.LAST_90_DAYS}>Last 90 Days</SelectItem>
              <SelectItem value={DateRangeType.ALL_TIME}>All Time</SelectItem>
              <SelectItem value={DateRangeType.CUSTOM}>Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRange === DateRangeType.CUSTOM && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Report"}
        </Button>

        {/* Info Text */}
        <p className="text-sm text-muted-foreground">
          Reports are generated on-demand and available for immediate use. 💾
        </p>
      </CardContent>
    </Card>
  );
}
