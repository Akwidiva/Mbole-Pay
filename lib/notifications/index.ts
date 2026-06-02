/**
 * Notifications Module Exports
 */

export { EmailService, default as EmailServiceDefault } from "./email-service";
export {
  NotificationFactory,
  getNotificationFactory,
  default as NotificationFactoryDefault,
} from "./notification-factory";

// Re-export types
export * from "@/types/notifications";
