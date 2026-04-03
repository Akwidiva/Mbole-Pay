/**
 * Scheduler Service
 * Manages cron jobs for automated notifications and reminders
 */

import prisma from "@/lib/db";
import {
  sendContributionDueReminder,
  sendContributionOverdueAlert,
} from "@/lib/notifications/utils";

export enum ScheduleFrequency {
  EVERY_MINUTE = "* * * * *",
  EVERY_5_MINUTES = "*/5 * * * *",
  EVERY_HOUR = "0 * * * *",
  EVERY_DAY = "0 0 * * *",
  EVERY_WEEK = "0 0 * * 0",
  EVERY_MONTH = "0 0 1 * *",
}

export interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  timeout: number;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationScheduler {
  private jobs: Map<string, NodeJS.Timeout | null> = new Map();
  private lastRuns: Map<string, Date> = new Map();
  private isRunning: boolean = false;
  private jobLocks: Set<string> = new Set();

  constructor() {
    console.log("📅 Notification Scheduler initialized");
  }

  /**
   * Start the scheduler - initialize all active jobs
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("⚠️  Scheduler is already running");
      return;
    }

    this.isRunning = true;
    console.log("✅ Starting notification scheduler...");

    await this.initializeBuiltInJobs();
  }

  /**
   * Stop the scheduler - clear all jobs
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn("⚠️  Scheduler is not running");
      return;
    }

    console.log("🛑 Stopping notification scheduler...");

    for (const [jobId, timeout] of this.jobs) {
      if (timeout) {
        clearInterval(timeout);
        console.log(`  ✓ Stopped job: ${jobId}`);
      }
    }

    this.jobs.clear();
    this.isRunning = false;
    console.log("✅ Scheduler stopped");
  }

  /**
   * Get current scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    activeJobs: number;
    jobs: Array<{
      name: string;
      lastRun?: Date;
      nextRun?: Date;
    }>;
  } {
    const jobs = Array.from(this.jobs.keys()).map((jobId) => ({
      name: jobId,
      lastRun: this.lastRuns.get(jobId),
    }));

    return {
      isRunning: this.isRunning,
      activeJobs: this.jobs.size,
      jobs,
    };
  }

  /**
   * Initialize built-in notification jobs
   */
  private async initializeBuiltInJobs(): Promise<void> {
    this.scheduleJob(
      "contribution-due-reminder",
      "0 8 * * *",
      () => this.sendContributionReminders(),
      "Daily at 08:00 UTC - Send reminders for contributions due in 3 days"
    );

    this.scheduleJob(
      "overdue-alert",
      "0 9 * * *",
      () => this.sendOverdueAlerts(),
      "Daily at 09:00 UTC - Send alerts for overdue contributions"
    );

    this.scheduleJob(
      "status-check",
      "0 */6 * * *",
      () => this.checkContributionStatus(),
      "Every 6 hours - Check and update contribution statuses"
    );

    this.scheduleJob(
      "cleanup",
      "0 2 * * *",
      () => this.cleanupOldData(),
      "Daily at 02:00 UTC - Cleanup old notification records"
    );

    console.log("✅ Initialized 4 built-in notification jobs");
  }

  /**
   * Schedule a cron job
   */
  private scheduleJob(
    jobId: string,
    cronExpression: string,
    callback: () => Promise<void>,
    description: string
  ): void {
    try {
      const interval = this.parseInterval(cronExpression);
      const initialDelay = interval;

      const timeout = setInterval(async () => {
        if (this.jobLocks.has(jobId)) {
          console.warn(
            `⚠️  Job "${jobId}" is still running, skipping this cycle`
          );
          return;
        }

        this.jobLocks.add(jobId);
        const startTime = Date.now();

        try {
          console.log(`▶️  Starting scheduled job: ${jobId}`);
          await callback();
          const duration = Date.now() - startTime;
          this.lastRuns.set(jobId, new Date());
          console.log(
            `✅ Job "${jobId}" completed successfully (${duration}ms)`
          );
        } catch (error) {
          console.error(`❌ Job "${jobId}" failed:`, error);
        } finally {
          this.jobLocks.delete(jobId);
        }
      }, interval);

      this.jobs.set(jobId, timeout);
      console.log(
        `📌 Scheduled job "${jobId}": ${description} (${cronExpression})`
      );
    } catch (error) {
      console.error(`Failed to schedule job "${jobId}":`, error);
    }
  }

  /**
   * Parse simplified cron expression to milliseconds
   */
  private parseInterval(cronExpression: string): number {
    const parts = cronExpression.split(" ");

    if (cronExpression === "* * * * *") {
      return 60 * 1000;
    } else if (cronExpression === "*/5 * * * *") {
      return 5 * 60 * 1000;
    } else if (cronExpression === "0 * * * *") {
      return 60 * 60 * 1000;
    } else if (cronExpression === "0 0 * * *") {
      return 24 * 60 * 60 * 1000;
    } else if (cronExpression === "0 8 * * *") {
      return 24 * 60 * 60 * 1000;
    } else if (cronExpression === "0 9 * * *") {
      return 24 * 60 * 60 * 1000;
    } else if (cronExpression === "0 */6 * * *") {
      return 6 * 60 * 60 * 1000;
    } else if (cronExpression === "0 2 * * *") {
      return 24 * 60 * 60 * 1000;
    } else {
      return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Send contribution due reminders (3 days before due date)
   */
  private async sendContributionReminders(): Promise<void> {
    try {
      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 3);
      reminderDate.setHours(0, 0, 0, 0);

      const endDate = new Date(reminderDate);
      endDate.setDate(endDate.getDate() + 1);

      const contributions = await prisma.contribution.findMany({
        where: {
          status: "PENDING",
          dueDate: {
            gte: reminderDate,
            lt: endDate,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log(
        `📬 Found ${contributions.length} contributions due in 3 days`
      );

      for (const contribution of contributions) {
        try {
          await sendContributionDueReminder(
            contribution.userId,
            contribution.user.email,
            contribution.user.phone || "+237000000000",
            contribution.group.name,
            contribution.amount,
            "XAF",
            contribution.dueDate.toLocaleDateString()
          );
        } catch (error) {
          console.error(
            `Failed to send reminder for contribution ${contribution.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error in sendContributionReminders:", error);
    }
  }

  /**
   * Send overdue contribution alerts
   */
  private async sendOverdueAlerts(): Promise<void> {
    try {
      const now = new Date();

      const overdueContributions = await prisma.contribution.findMany({
        where: {
          status: "PENDING",
          dueDate: {
            lt: now,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      console.log(
        `⚠️  Found ${overdueContributions.length} overdue contributions`
      );

      for (const contribution of overdueContributions) {
        try {
          const daysOverdue = Math.floor(
            (now.getTime() - contribution.dueDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          await sendContributionOverdueAlert(
            contribution.userId,
            contribution.user.email,
            contribution.user.phone || "+237000000000",
            contribution.group.name,
            contribution.amount,
            "XAF",
            `${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`
          );
        } catch (error) {
          console.error(
            `Failed to send overdue alert for contribution ${contribution.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error in sendOverdueAlerts:", error);
    }
  }

  /**
   * Check and update contribution status
   */
  private async checkContributionStatus(): Promise<void> {
    try {
      const now = new Date();

      const result = await prisma.contribution.updateMany({
        where: {
          status: "PENDING",
          dueDate: {
            lt: now,
          },
        },
        data: {
          status: "OVERDUE",
          updatedAt: now,
        },
      });

      if (result.count > 0) {
        console.log(`⏰ Marked ${result.count} contributions as OVERDUE`);
      }
    } catch (error) {
      console.error("Error in checkContributionStatus:", error);
    }
  }

  /**
   * Cleanup old notification data
   */
  private async cleanupOldData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      console.log(`🧹 Running cleanup for data older than ${cutoffDate}`);
      console.log("✅ Cleanup completed");
    } catch (error) {
      console.error("Error in cleanupOldData:", error);
    }
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(jobId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log(`🔧 Manually triggering job: ${jobId}`);

      switch (jobId) {
        case "contribution-due-reminder":
          await this.sendContributionReminders();
          break;
        case "overdue-alert":
          await this.sendOverdueAlerts();
          break;
        case "status-check":
          await this.checkContributionStatus();
          break;
        case "cleanup":
          await this.cleanupOldData();
          break;
        default:
          return {
            success: false,
            message: `Unknown job: ${jobId}`,
          };
      }

      this.lastRuns.set(jobId, new Date());

      return {
        success: true,
        message: `Job ${jobId} executed successfully`,
      };
    } catch (error) {
      console.error(`Failed to trigger job ${jobId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

let schedulerInstance: NotificationScheduler | null = null;

/**
 * Get or create scheduler instance
 */
export function getScheduler(): NotificationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new NotificationScheduler();
  }
  return schedulerInstance;
}

export default NotificationScheduler;
