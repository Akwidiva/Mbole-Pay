/**
 * Scheduler Utilities
 * Helper functions for managing scheduled jobs
 */

import { getScheduler } from "@/lib/scheduler/notification-scheduler";

/**
 * Test contribution reminder job
 * Sends test reminder to provided email/phone
 */
export async function testContributionReminder(options: {
  groupName: string;
  amount: number;
  dueDate: string;
  userEmail: string;
  userPhone: string;
}): Promise<void> {
  console.log("🧪 Testing contribution reminder job...");

  try {
    const { sendContributionDueReminder } = await import(
      "@/lib/notifications/utils"
    );

    await sendContributionDueReminder(
      "test-user",
      options.userEmail,
      options.userPhone,
      options.groupName,
      options.amount,
      "XAF",
      options.dueDate
    );

    console.log("✅ Test reminder sent successfully");
  } catch (error) {
    console.error("❌ Test reminder failed:", error);
    throw error;
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  const scheduler = getScheduler();
  return scheduler.getStatus();
}

/**
 * Manually trigger a specific job
 */
export async function triggerJob(jobId: string) {
  const scheduler = getScheduler();
  return scheduler.triggerJob(jobId);
}

/**
 * Start scheduler
 */
export async function startScheduler() {
  const scheduler = getScheduler();
  await scheduler.start();
  console.log("✅ Scheduler started");
}

/**
 * Stop scheduler
 */
export async function stopScheduler() {
  const scheduler = getScheduler();
  await scheduler.stop();
  console.log("✅ Scheduler stopped");
}

/**
 * Get available jobs info
 */
export function getAvailableJobs() {
  return [
    {
      id: "contribution-due-reminder",
      name: "Contribution Due Reminder",
      description: "Send reminders for contributions due in 3 days",
      schedule: "Daily at 08:00 UTC",
      command: "curl -X POST http://localhost:3000/api/scheduler/trigger -H 'Content-Type: application/json' -d '{\"jobId\": \"contribution-due-reminder\"}'",
    },
    {
      id: "overdue-alert",
      name: "Overdue Alert",
      description: "Send alerts for overdue contributions",
      schedule: "Daily at 09:00 UTC",
      command: "curl -X POST http://localhost:3000/api/scheduler/trigger -H 'Content-Type: application/json' -d '{\"jobId\": \"overdue-alert\"}'",
    },
    {
      id: "status-check",
      name: "Status Check",
      description: "Check and update contribution statuses",
      schedule: "Every 6 hours",
      command: "curl -X POST http://localhost:3000/api/scheduler/trigger -H 'Content-Type: application/json' -d '{\"jobId\": \"status-check\"}'",
    },
    {
      id: "cleanup",
      name: "Data Cleanup",
      description: "Cleanup old notification records",
      schedule: "Daily at 02:00 UTC",
      command: "curl -X POST http://localhost:3000/api/scheduler/trigger -H 'Content-Type: application/json' -d '{\"jobId\": \"cleanup\"}'",
    },
  ];
}

/**
 * Format scheduler status for display
 */
export function formatSchedulerStatus(status: ReturnType<typeof getSchedulerStatus>): string {
  return `
Scheduler Status
================
Running: ${status.isRunning ? "✅ Yes" : "❌ No"}
Active Jobs: ${status.activeJobs}

Jobs:
${status.jobs
  .map((job) => `  • ${job.name}: ${job.lastRun ? new Date(job.lastRun).toLocaleString() : "Not yet run"}`)
  .join("\n")}
  `;
}
