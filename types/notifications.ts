/**
 * Notification Types & Enums
 * Defines all notification-related interfaces and enumerations
 */

// Notification types
export enum NotificationType {
  CONTRIBUTION_DUE = "CONTRIBUTION_DUE",
  CONTRIBUTION_OVERDUE = "CONTRIBUTION_OVERDUE",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYOUT_AVAILABLE = "PAYOUT_AVAILABLE",
  PAYOUT_SCHEDULED = "PAYOUT_SCHEDULED",
  DISPUTE_OPENED = "DISPUTE_OPENED",
  DISPUTE_RESOLUTION_VOTE = "DISPUTE_RESOLUTION_VOTE",
  DISPUTE_RESOLVED = "DISPUTE_RESOLVED",
  GROUP_INVITATION = "GROUP_INVITATION",
  MEMBER_JOINED = "MEMBER_JOINED",
  CUSTOM = "CUSTOM",
}

// Notification channels
export enum NotificationChannel {
  EMAIL = "EMAIL",
  PUSH = "PUSH",
  IN_APP = "IN_APP",
}

// Notification priority
export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// Notification status
export enum NotificationStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  DELIVERED = "DELIVERED",
  BOUNCED = "BOUNCED",
  UNSUBSCRIBED = "UNSUBSCRIBED",
}

// Base notification payload
export interface NotificationPayload {
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  type: NotificationType;
  channels: NotificationChannel[];
  priority?: NotificationPriority;
  subject?: string;
  message: string;
  templateId?: string;
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Email-specific options
export interface EmailOptions {
  from?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Notification template
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  channels: NotificationChannel[];
  emailSubject?: string;
  emailTemplate?: string;
  variables: string[]; // Expected template variables
  createdAt: Date;
  updatedAt: Date;
}

// Service responses
export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

// Email service interface
export interface IEmailService {
  send(options: EmailOptions): Promise<SendEmailResponse>;
  sendBatch(options: EmailOptions[]): Promise<SendEmailResponse[]>;
  verifyCredentials(): Promise<boolean>;
  getQuota?(): Promise<{ used: number; limit: number }>;
}

// Notification template variables for different types
export const NOTIFICATION_VARIABLES = {
  [NotificationType.CONTRIBUTION_DUE]: [
    "userName",
    "groupName",
    "amount",
    "dueDate",
    "currency",
  ],
  [NotificationType.CONTRIBUTION_OVERDUE]: [
    "userName",
    "groupName",
    "amount",
    "overdueBy",
    "currency",
  ],
  [NotificationType.PAYMENT_RECEIVED]: [
    "userName",
    "groupName",
    "amount",
    "reference",
    "currency",
  ],
  [NotificationType.PAYMENT_FAILED]: [
    "userName",
    "groupName",
    "amount",
    "reason",
    "currency",
  ],
  [NotificationType.PAYOUT_AVAILABLE]: [
    "userName",
    "groupName",
    "amount",
    "payoutDate",
    "currency",
  ],
  [NotificationType.DISPUTE_OPENED]: [
    "userName",
    "groupName",
    "disputeTitle",
    "votingDeadline",
  ],
  [NotificationType.DISPUTE_RESOLVED]: [
    "userName",
    "groupName",
    "disputeTitle",
    "resolution",
  ],
};
