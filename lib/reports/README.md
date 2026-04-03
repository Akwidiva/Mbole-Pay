# Financial Reporting System

Complete financial report generation and export system for Mbole Pay. Generates analytics reports with multiple export formats (PDF, Excel, CSV, JSON).

## Architecture

```
┌─────────────────────────────────────┐
│      Report Factory (API Layer)      │
│  - generateReport()                  │
│  - getReportPreview()                │
├─────────────────────────────────────┤
│  Analytics Services (Calculation)    │
│  ├─ Analytics Service                │
│  └─ Coordinates data aggregation     │
├─────────────────────────────────────┤
│  Export Services (Format Conversion) │
│  ├─ Excel Export Service             │
│  ├─ PDF Export Service               │
│  └─ CSV/JSON conversion              │
├─────────────────────────────────────┤
│     Database (Prisma ORM)            │
│     - Contributions, Groups, Users   │
└─────────────────────────────────────┘
```

### Core Components

#### 1. Analytics Service (`analytics-service.ts`)

Calculates financial statistics and metrics at multiple levels.

**Methods:**

```typescript
// Group-level statistics
calculateGroupStats(groupId, startDate?, endDate?): Promise<FinancialStats>
  - Returns: totalContributions, totalPaid, totalPending, totalOverdue, completion rate

// User-level statistics
calculateUserStats(userId, startDate?, endDate?): Promise<FinancialStats>
  - Returns: User's financial metrics

// Complete group report with details
getGroupFinancialSummary(groupId, startDate?, endDate?): Promise<GroupFinancialSummary>
  - Returns: Group info, members count, all contributions[], stats

// Personal contribution statement
getIndividualStatement(userId, startDate?, endDate?): Promise<IndividualStatement>
  - Returns: Groups[], stats per group, recent contributions

// System-wide analytics
getAnalyticsData(groupId?, startDate?, endDate?): Promise<AnalyticsData>
  - Returns: Totals, byStatus, byGroup[], trends

// Parse date range type
getDateRange(rangeType): { startDate, endDate }
  - Supports: THIS_MONTH, LAST_MONTH, THIS_QUARTER, THIS_YEAR, LAST_30_DAYS, LAST_90_DAYS, ALL_TIME, CUSTOM
```

**Database Queries:**

- Aggregates contributions with Prisma relations
- Filters by date range, status, group, user
- Calculates completion rates and overdue tracking
- Groups data hierarchically (system → group → user → contribution)

#### 2. Excel Export Service (`excel-export-service.ts`)

Converts analytics data to Excel/CSV formats.

**Methods:**

```typescript
// Group report in Excel format
generateGroupSummaryExcel(summary): ExcelReportData
  - Columns: Contributor, Amount, Status, Due Date, Paid Date, Days Overdue
  - Summary: Group info + financial totals

// User statement in Excel format
generateIndividualStatementExcel(statement): ExcelReportData
  - Columns: Group, Amount, Status, Due Date, Dates
  - Summary: User info + totals across groups

// System analytics Excel format
generateAnalyticsExcel(analytics): ExcelReportData
  - Columns: Group Name, Total Amount, Members, Completion Rate
  - Summary: Period, revenue, status counts

// Convert to CSV string
convertToCSV(excelData): string
  - Proper quote escaping and comma handling
  - Outputs: Summary rows + headers + data rows

// Convert to JSON
toJSON(excelData): object
  - Structured JSON with sheet, columns, data, summary
```

**Output Formats:**

```typescript
interface ExcelReportData {
  columns: Array<{ header: string; key: string }>;
  rows: Array<Record<string, any>>;
  summary?: Record<string, any>;
  totals?: FinancialStats;
}
```

#### 3. PDF Export Service (`pdf-export-service.ts`)

Generates PDF-compatible data structures and multiple output formats.

**Methods:**

```typescript
// Group financial report PDF data
generateGroupSummaryPdf(summary): PdfReportData
  - Sections: Title, date, group info, financial table, contribution details

// Individual contribution statement PDF
generateIndividualStatementPdf(statement): PdfReportData
  - Sections: Title, statement date, personal info, stats, group breakdown

// System-wide analytics PDF
generateAnalyticsPdf(analytics): PdfReportData
  - Sections: Title, period, financial summary, status breakdown, group performance

// Convert to HTML string
toHTML(pdfData): string
  - CSS-styled HTML with table formatting and page breaks
  - Full document with inline styles

// Convert to plain text
toText(pdfData): string
  - Formatted text report with separators and aligned tables
  - Suitable for email or command-line output
```

**Output Formats:**

```typescript
interface PdfReportData {
  title: string;
  generatedDate: Date;
  sections: PdfSection[];
}

interface PdfSection {
  title: string;
  content: string | PdfTable;
  type: 'text' | 'table' | 'summary';
}
```

#### 4. Report Factory (`report-factory.ts`)

Orchestrates report generation across all services.

**Methods:**

```typescript
// Main report generation
generateReport(options: ReportOptions): Promise<ReportGenerationResult>
  - Coordinates analytics retrieval + format conversion
  - Returns: fileName, fileSize, duration, success status

// Get preview data
getReportPreview(options: ReportOptions): Promise<any>
  - Returns raw data without formatting (JSON preview)

// List available reports
getAvailableReports(): ReportMetadata[]
  - Shows supported report types, formats, descriptions
```

## API Endpoints

### 1. Generate Report

**Endpoint:** `POST /api/reports/generate`

**Request:**
```json
{
  "reportType": "GROUP_SUMMARY",
  "format": "PDF",
  "groupId": "group-123",
  "dateRange": "THIS_MONTH"
}
```

**Query Parameters:**
- `reportType` (required): Report type (GROUP_SUMMARY | INDIVIDUAL_STATEMENT | CONTRIBUTION_HISTORY | FINANCIAL_STATEMENT | PAYMENT_SUMMARY | PAYOUT_SCHEDULE)
- `format` (required): Export format (PDF | EXCEL | CSV | JSON)
- `groupId` (optional): Group ID for group-scoped reports
- `userId` (optional): User ID (defaults to current user)
- `dateRange` (optional): Predefined range (THIS_MONTH | LAST_30_DAYS | etc)
- `startDate` (optional): ISO date for custom range
- `endDate` (optional): ISO date for custom range

**Response:**
```json
{
  "success": true,
  "reportType": "GROUP_SUMMARY",
  "format": "PDF",
  "fileName": "GROUP_SUMMARY_1234567890.pdf",
  "fileSize": 45120,
  "generatedAt": "2024-01-15T10:30:00Z",
  "duration": 245
}
```

**Error Responses:**
```json
// 400 - Bad Request
{ "error": "Missing required fields: reportType, format" }

// 401 - Unauthorized
{ "error": "Unauthorized" }

// 403 - Forbidden
{ "error": "Unauthorized: Not a member of this group" }

// 500 - Server Error
{ "error": "Internal server error" }
```

### 2. Get Available Reports (GET /api/reports/generate)

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "type": "GROUP_SUMMARY",
      "name": "Group Financial Summary",
      "description": "Complete financial overview of a group",
      "formats": ["PDF", "EXCEL", "CSV", "JSON"]
    }
  ],
  "formats": ["PDF", "EXCEL", "CSV", "JSON"],
  "dateRanges": ["THIS_MONTH", "LAST_30_DAYS", ...]
}
```

### 3. Preview Report

**Endpoint:** `GET /api/reports/preview`

**Query Parameters:**
- `reportType` (required): Report type
- `groupId` (optional): Group ID
- `userId` (optional): User ID
- `dateRange` (optional): Date range
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Response:**
```json
{
  "success": true,
  "reportType": "GROUP_SUMMARY",
  "preview": {
    "groupId": "group-123",
    "name": "Weekend Savings",
    "totalContributions": 10,
    "totalPaid": 5000000,
    "totalPending": 2000000,
    "completionRate": 71.43,
    "contributions": [...]
  }
}
```

## Report Types

### 1. Group Summary (`GROUP_SUMMARY`)
- **Scope:** Single group
- **Data:** All contributions, members, financial totals
- **Use Case:** Group audit, treasurer reconciliation
- **Formats:** PDF, Excel, CSV, JSON

### 2. Individual Statement (`INDIVIDUAL_STATEMENT`)
- **Scope:** Single user across all groups
- **Data:** Personal contributions, groups joined, totals
- **Use Case:** Member record, loan applications, personal finance
- **Formats:** PDF, Excel, CSV, JSON

### 3. Contribution History (`CONTRIBUTION_HISTORY`)
- **Scope:** Group or user contributions over time
- **Data:** Detailed contribution records with timeline
- **Use Case:** Trend analysis, payment tracking
- **Formats:** PDF, Excel, CSV, JSON

### 4. Financial Statement (`FINANCIAL_STATEMENT`)
- **Scope:** System or group-wide
- **Data:** Aggregate statistics, performance metrics, trends
- **Use Case:** Management reporting, analytics
- **Formats:** PDF, Excel, CSV, JSON

### 5. Payment Summary (`PAYMENT_SUMMARY`)
- **Scope:** Payment transactions
- **Data:** Payment records, amounts, status
- **Use Case:** Payment audit trail
- **Formats:** PDF, Excel, CSV, JSON

### 6. Payout Schedule (`PAYOUT_SCHEDULE`)
- **Scope:** Scheduled payouts
- **Data:** Upcoming payout dates and recipients
- **Use Case:** Payout planning
- **Formats:** PDF, Excel, CSV, JSON

## Export Formats

### PDF Export
- **Method:** HTML/text conversion (no external library)
- **Output:** HTML string ready for print CSS
- **Use Case:** Email attachment, printed reports
- **Features:**
  - Professional formatting
  - Page breaks
  - Table styling

### Excel Export
- **Method:** CSV-compatible format
- **Output:** Comma-separated values with proper escaping
- **Use Case:** Spreadsheet analysis, data import
- **Note:** Currently exports as CSV; upgrade to XLSX with `exceljs` for Office format

### CSV Export
- **Method:** Direct CSV conversion
- **Output:** RFC 4180 compliant CSV format
- **Use Case:** Database import, generic spreadsheet
- **Features:**
  - Quote escaping
  - Header row
  - Summary rows

### JSON Export
- **Method:** Structured JSON
- **Output:** Pretty-printed JSON
- **Use Case:** API responses, data interchange
- **Features:**
  - Hierarchical structure
  - Full data preservation
  - Easy parsing

## Date Range Types

```typescript
enum DateRangeType {
  THIS_MONTH = "THIS_MONTH",           // Current calendar month
  LAST_MONTH = "LAST_MONTH",           // Previous calendar month
  THIS_QUARTER = "THIS_QUARTER",       // Current 3-month quarter
  THIS_YEAR = "THIS_YEAR",             // Calendar year to date
  LAST_30_DAYS = "LAST_30_DAYS",       // Last 30 calendar days
  LAST_90_DAYS = "LAST_90_DAYS",       // Last 90 calendar days
  ALL_TIME = "ALL_TIME",               // Entire history
  CUSTOM = "CUSTOM",                   // User-specified startDate/endDate
}
```

## Usage Examples

### Example 1: Generate Group Summary (PDF)

```typescript
import { getReportFactory } from "@/lib/reports";
import { ReportType, ExportFormat } from "@/types/reports";

const factory = getReportFactory();

const result = await factory.generateReport({
  reportType: ReportType.GROUP_SUMMARY,
  format: ExportFormat.PDF,
  groupId: "group-123",
  dateRange: "THIS_MONTH",
});

console.log(`Report generated: ${result.fileName} (${result.fileSize} bytes)`);
```

### Example 2: Get Individual Statement (Excel)

```typescript
const result = await factory.generateReport({
  reportType: ReportType.INDIVIDUAL_STATEMENT,
  format: ExportFormat.EXCEL,
  userId: "user-123",
  dateRange: "LAST_90_DAYS",
});
```

### Example 3: Custom Date Range (JSON Preview)

```typescript
const preview = await factory.getReportPreview({
  reportType: ReportType.FINANCIAL_STATEMENT,
  format: ExportFormat.JSON,
  dateRange: "CUSTOM",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
});
```

### Example 4: API Usage via cURL

```bash
# Generate group summary PDF
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "GROUP_SUMMARY",
    "format": "PDF",
    "groupId": "group-123",
    "dateRange": "THIS_MONTH"
  }'

# Get available reports
curl http://localhost:3000/api/reports/generate

# Preview report data
curl "http://localhost:3000/api/reports/preview?reportType=GROUP_SUMMARY&groupId=group-123"
```

## Type Definitions

```typescript
interface ReportOptions {
  reportType: ReportType;
  format: ExportFormat;
  groupId?: string;
  userId?: string;
  dateRange?: DateRangeType;
  startDate?: Date;
  endDate?: Date;
}

interface ReportGenerationResult {
  success: boolean;
  reportType: ReportType;
  format: ExportFormat;
  fileName: string;
  fileSize: number;
  generatedAt: Date;
  duration: number;
  error?: string;
}

interface FinancialStats {
  totalContributions: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageAmount: number;
  completionRate: number;
}

interface GroupFinancialSummary {
  groupId: string;
  name: string;
  memberCount: number;
  frequency: string;
  stats: FinancialStats;
  contributions: ContributionRecord[];
  generatedAt: Date;
}

interface IndividualStatement {
  userId: string;
  name: string;
  email: string;
  groups: Array<{ groupId: string; stats: FinancialStats }>;
  totalStats: FinancialStats;
}
```

## Performance Considerations

- **Analytics Calculations:** Optimized with Prisma aggregations
- **Large Reports:** Consider pagination for 1000+ records
- **Date Range:** ALL_TIME reports may be slow for >2 years of data
- **Concurrent Requests:** Max 5 concurrent report generations recommended
- **Caching:** Reports should be cached for 1 hour to prevent regeneration
- **File Storage:** Consider file size limits (100MB for Excel, 50MB for PDF)

## Future Enhancements

1. **XLSX Export:** Upgrade to `exceljs` for native Excel format
2. **PDF Export:** Integrate `pdfkit` or `html2pdf` for true PDF generation
3. **Report Scheduling:** Schedule recurring reports
4. **Report Storage:** Database or S3 for generated files
5. **Email Distribution:** Automatic report delivery
6. **Advanced Filters:** Complex filtering logic
7. **Chart Integration:** Embedded graphs/charts in reports
8. **Multi-language:** Localize report text

## Troubleshooting

### Report Generation Fails
- Check date range validity
- Verify group membership permissions
- Ensure user exists in database
- Check database connectivity

### Slow Report Generation
- Reduce date range
- Check database indexes on contributions
- Monitor database connection pool
- Consider pagination for large groups

### Export Format Issues
- PDF: Verify HTML structure
- Excel: Check cell value types
- CSV: Verify quote escaping
- JSON: Confirm serialization logic

## Testing

```bash
# Test report generation
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: [session-cookie]" \
  -d '{"reportType": "GROUP_SUMMARY", "format": "JSON", "groupId": "test-group"}'

# Test report preview
curl "http://localhost:3000/api/reports/preview?reportType=GROUP_SUMMARY" \
  -H "Cookie: [session-cookie]"
```

## Security Notes

- Authentication required for all endpoints
- Authorization checks for group access
- Users can only view their own individual statements
- Rate limiting recommended (max 10 reports/hour)
- Audit logging of report requests recommended
