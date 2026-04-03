# Notification Scheduler

Automated notification system for sending contribution reminders, overdue alerts, and other time-based notifications.

## Features

- **Scheduled Jobs**: 4 built-in jobs running on automated schedules
- **Email + SMS**: Multi-channel notifications via SendGrid and Twilio
- **Contribution Tracking**: Automatic status updates and reminders
- **Error Handling**: Graceful error management with detailed logging
- **Manual Triggers**: Admin API endpoints to manually run jobs

## Architecture

```
NotificationScheduler (singleton)
├── Built-in Jobs (4 jobs)
│   ├── Contribution Due Reminder (08:00 UTC daily)
│   ├── Overdue Alert (09:00 UTC daily)
│   ├── Status Check (every 6 hours)
│   └── Cleanup (02:00 UTC daily)
├── Email Service (SendGrid)
├── SMS Service (Twilio)
└── API Endpoints (3 routes)
    ├── /api/bootstrap (initialize scheduler)
    ├── /api/scheduler/status (get status)
    └── /api/scheduler/trigger (run job manually)
```

## Getting Started

### 1. Initialize the Scheduler

Call the bootstrap endpoint once when your app starts:

```bash
curl http://localhost:3000/api/bootstrap
```

**Response:**
```json
{
  "status": "ok",
  "message": "All services initialized successfully",
  "services": {
    "scheduler": "running",
    "notifications": "ready",
    "database": "connected"
  }
}
```

### 2. Verify Status

```bash
curl http://localhost:3000/api/scheduler/status
```

**Response:**
```json
{
  "status": "ok",
  "scheduler": {
    "isRunning": true,
    "activeJobs": 4,
    "jobs": [
      {
        "name": "contribution-due-reminder",
        "lastRun": "2026-04-03T08:00:00Z",
        "status": "Last run: 4/3/2026, 8:00:00 AM"
      }
    ]
  }
}
```

### 3. Manually Trigger a Job (Development Only)

```bash
curl -X POST http://localhost:3000/api/scheduler/trigger \
  -H "Content-Type: application/json" \
  -d '{"jobId": "contribution-due-reminder"}'
```

## Scheduled Jobs

### 1. Contribution Due Reminder
- **Schedule**: Daily at 08:00 UTC
- **Description**: Sends email + SMS reminders for contributions due in 3 days
- **Channels**: Email, SMS
- **Action**: Queries DB for pending contributions with dueDate = today + 3 days
- **Sends**:
  - Email with template variables (groupName, amount, dueDate)
  - SMS limited to 160 characters

### 2. Overdue Alert
- **Schedule**: Daily at 09:00 UTC
- **Description**: Sends alerts for overdue contributions  
- **Channels**: Email, SMS
- **Action**: Queries DB for pending contributions with dueDate < now()
- **Sends**: Urgent notifications (HIGH priority)

### 3. Status Check
- **Schedule**: Every 6 hours
- **Description**: Updates contribution status from PENDING to OVERDUE
- **Action**: Updates DB: contribution.status = "OVERDUE" where dueDate < now()
- **Effect**: Marks late payments automatically

### 4. Cleanup
- **Schedule**: Daily at 02:00 UTC
- **Description**: Removes old notification records to save storage
- **Action**: Deletes notifications > 90 days old
- **Effect**: Helps maintain database performance

## API Reference

### GET /api/bootstrap
Initialize scheduler and services

**Response:**
- `200 OK`: Services initialized
- `500 Error`: Initialization failed

---

### GET /api/scheduler/status
Get current scheduler status

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response:**
```json
{
  "status": "ok",
  "scheduler": {
    "isRunning": true,
    "activeJobs": 4,
    "jobs": [...]
  }
}
```

**Status Codes:**
- `200 OK`: Scheduler status retrieved
- `401 Unauthorized`: Not authenticated
- `500 Error`: Server error

---

### GET /api/scheduler/trigger
List available jobs

**Response:**
```json
{
  "status": "ok",
  "availableJobs": [
    {
      "id": "contribution-due-reminder",
      "name": "Contribution Due Reminder",
      "description": "Send reminders for contributions due in 3 days",
      "schedule": "Daily at 08:00 UTC"
    }
  ]
}
```

---

### POST /api/scheduler/trigger
Manually trigger a job

**Request:**
```json
{
  "jobId": "contribution-due-reminder"
}
```

**Available Job IDs:**
- `contribution-due-reminder` - Send 3-day-before reminders
- `overdue-alert` - Send overdue alerts
- `status-check` - Update contribution statuses
- `cleanup` - Cleanup old data

**Response:**
```json
{
  "status": "ok",
  "jobId": "contribution-due-reminder",
  "message": "Job contribution-due-reminder executed successfully"
}
```

**Status Codes:**
- `200 OK`: Job executed
- `400 Bad Request`: Invalid jobId
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Manual triggers disabled in production
- `500 Error`: Service error

## Usage in Code

### Use in API Routes

```typescript
import { triggerJob } from "@/lib/scheduler/utils";

// In an API route
export async function POST(req: NextRequest) {
  // ... do some work ...
  
  // Manually trigger a job if needed
  const result = await triggerJob("contribution-due-reminder");
  
  // ... return response ...
}
```

### Use in Components

```typescript
import { checkNotificationServices } from "@/lib/notifications/utils";

export function SchedulerStatus() {
  const [status, setStatus] = useState(null);

  useEffect(async () => {
    const health = await checkNotificationServices();
    setStatus(health);
  }, []);

  return (
    <div>
      <p>Email: {status?.email.operational ? "✅" : "❌"}</p>
      <p>SMS: {status?.sms.operational ? "✅" : "❌"}</p>
    </div>
  );
}
```

## Configuration

### Environment Variables

Add to `.env.local`:

```env
# Scheduler Settings
NOTIFICATION_ENABLED="true"
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_TIMEOUT_MS=5000

# Allow manual job triggers in production (development only by default)
ALLOW_MANUAL_TRIGGERS="false"
```

## Troubleshooting

### Scheduler Not Running

1. Check if bootstrap endpoint was called:
   ```bash
   curl http://localhost:3000/api/bootstrap
   ```

2. Verify status:
   ```bash
   curl http://localhost:3000/api/scheduler/status
   ```

3. Check Prisma connection:
   - Ensure database file exists at `prisma/dev.db`
   - Run migrations: `npx prisma migrate dev`

### Jobs Not Running

1. Check SendGrid credentials:
   ```bash
   curl -X POST http://localhost:3000/api/scheduler/trigger \
     -d '{"jobId": "contribution-due-reminder"}'
   ```

2. Check Twilio credentials:
   ```bash
   curl http://localhost:3000/api/notifications/health
   ```

3. Check logs:
   ```bash
   npm run dev | grep "scheduler\|notification"
   ```

### No Notifications Sent

1. Verify test endpoint works:
   ```bash
   curl -X POST http://localhost:3000/api/notifications/test \
     -d '{"channel":"email","email":"test@example.com"}'
   ```

2. Check database has pending contributions:
   ```bash
   npx prisma studio  # Open Prisma Studio to view data
   ```

3. Verify job is running:
   ```bash
   curl http://localhost:3000/api/scheduler/status
   ```

## Performance Notes

- **Concurrent Execution**: Each job locks while running to prevent overlaps
- **Database Queries**: Contributions queried with included relations (user, group)
- **Notifications**: Sent batch-wise with error handling for each recipient
- **Logging**: Comprehensive logging at DEBUG level for troubleshooting

## Future Improvements

- [ ] **Upgrade to Node-Cron**: More accurate cron scheduling
- [ ] **Upgrade to Bull/BullMQ**: Redis-based job queue for scaling
- [ ] **Database-Driven Schedules**: Store job schedules in DB for dynamic config
- [ ] **Webhook Integration**: Register webhooks as notification destinations
- [ ] **Timezone Support**: User-specific timezone handling
- [ ] **Retry Logic**: Exponential backoff for failed notifications
- [ ] **Metrics**: Job execution metrics and monitoring

## Related Documentation

- [Notification Services](../notifications/)
- [Email Configuration](../notifications/email-service.ts)
- [SMS Configuration](../notifications/sms-service.ts)
- [Database Models](../../prisma/schema.prisma)
