import { startQueueWorkers } from "@/lib/queue/workers";

declare global {
  // eslint-disable-next-line no-var
  var __MBOLE_QUEUE_BOOTSTRAPPED__: boolean | undefined;
}

/**
 * Boots BullMQ workers once per Node.js process.
 * Safe for repeated imports in server runtime.
 */
export function bootstrapQueueWorkers() {
  if (typeof window !== "undefined") return;
  if (process.env.DISABLE_QUEUE_WORKERS === "true") return;

  if (!global.__MBOLE_QUEUE_BOOTSTRAPPED__) {
    startQueueWorkers();
    global.__MBOLE_QUEUE_BOOTSTRAPPED__ = true;
  }
}
