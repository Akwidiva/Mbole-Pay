/**
 * Scheduler Initializer
 * Starts notification scheduler on app startup
 * Import this in your root layout or API route
 */

import { getScheduler } from "@/lib/scheduler/notification-scheduler";

let initialized = false;

/**
 * Initialize the scheduler
 * This should be called once when the app starts
 */
export async function initializeScheduler(): Promise<void> {
  if (initialized) {
    console.log("⚠️  Scheduler already initialized");
    return;
  }

  try {
    const scheduler = getScheduler();
    await scheduler.start();
    initialized = true;
    console.log("✅ Scheduler initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize scheduler:", error);
    initialized = false;
  }
}

/**
 * Shutdown the scheduler
 * This should be called on app termination
 */
export async function shutdownScheduler(): Promise<void> {
  if (!initialized) {
    console.log("⚠️  Scheduler not running");
    return;
  }

  try {
    const scheduler = getScheduler();
    await scheduler.stop();
    initialized = false;
    console.log("✅ Scheduler shutdown successfully");
  } catch (error) {
    console.error("❌ Failed to shutdown scheduler:", error);
  }
}

/**
 * Check if scheduler is initialized
 */
export function isSchedulerInitialized(): boolean {
  return initialized;
}
