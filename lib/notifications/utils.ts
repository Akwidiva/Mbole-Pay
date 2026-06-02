/**
 * Notification Utility Functions
 * High-level API for sending different types of notifications
 */

import { getNotificationFactory } from "@/lib/notifications";
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationPayload,
} from "@/types/notifications";

/**
 * Send contribution due reminder
 */
export async function sendContributionDueReminder(
  userId: string,
  email: string,
  phone: string,
  groupName: string,
  amount: number,
  currency: string,
  dueDate: string
) {
  const factory = getNotificationFactory();

  return factory.send({
    recipientId: userId,
    recipientEmail: email,
    recipientPhone: phone,
    type: NotificationType.CONTRIBUTION_DUE,
       channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.HIGH,
    message: `Your ${amount} ${currency} contribution to ${groupName} is due on ${dueDate}`,
    variables: {
      userName: email.split("@")[0],
      groupName,
      amount,
      dueDate,
      currency,
    },
  });
}

/**
 * Send overdue contribution alert
 */
export async function sendContributionOverdueAlert(
  userId: string,
  email: string,
  phone: string,
  groupName: string,
  amount: number,
  currency: string,
  overdueBy: string
) {
  const factory = getNotificationFactory();

  return factory.send({
    recipientId: userId,
    recipientEmail: email,
    recipientPhone: phone,
    type: NotificationType.CONTRIBUTION_OVERDUE,
       channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.URGENT,
    message: `Your ${amount} ${currency} contribution to ${groupName} is ${overdueBy} overdue`,
    variables: {
      userName: email.split("@")[0],
      groupName,
      amount,
      overdueBy,
      currency,
    },
  });
}

/**
 * Send payment received confirmation
 */
export async function sendPaymentReceivedConfirmation(
  userId: string,
  email: string,
  phone: string,
  groupName: string,
  amount: number,
  currency: string,
  reference: string
) {
  const factory = getNotificationFactory();

  return factory.send({
    recipientId: userId,
    recipientEmail: email,
    recipientPhone: phone,
    type: NotificationType.PAYMENT_RECEIVED,
       channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.MEDIUM,
    message: `Payment of ${amount} ${currency} received by ${groupName}`,
    variables: {
      userName: email.split("@")[0],
      groupName,
      amount,
      reference,
      currency,
    },
  });
}

/**
 * Send payment failed alert
 */
export async function sendPaymentFailedAlert(
  userId: string,
  email: string,
  phone: string,
  groupName: string,
  amount: number,
  currency: string,
  reason: string
) {
  const factory = getNotificationFactory();

  return factory.send({
    recipientId: userId,
    recipientEmail: email,
    recipientPhone: phone,
    type: NotificationType.PAYMENT_FAILED,
       channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.HIGH,
    message: `Payment of ${amount} ${currency} failed: ${reason}`,
    variables: {
      userName: email.split("@")[0],
      groupName,
      amount,
      reason,
      currency,
    },
  });
}

/**
 * Send payout available notification
 */
export async function sendPayoutAvailableNotification(
  userId: string,
  email: string,
  phone: string,
  groupName: string,
  amount: number,
  currency: string,
  payoutDate: string
) {
  const factory = getNotificationFactory();

  return factory.send({
    recipientId: userId,
    recipientEmail: email,
    recipientPhone: phone,
    type: NotificationType.PAYOUT_AVAILABLE,
       channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.MEDIUM,
    message: `Your payout of ${amount} ${currency} from ${groupName} is ready`,
    variables: {
      userName: email.split("@")[0],
      groupName,
      amount,
      payoutDate,
      currency,
    },
  });
}

/**
 * Send dispute opened notification
 */
export async function sendDisputeOpenedNotification(
  userId: string,
  email: string,
  phone: string,
  groupName: string,
  disputeTitle: string,
  votingDeadline: string
) {
  const factory = getNotificationFactory();

  return factory.send({
    recipientId: userId,
    recipientEmail: email,
    recipientPhone: phone,
    type: NotificationType.DISPUTE_OPENED,
       channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.HIGH,
    message: `New dispute in ${groupName}: ${disputeTitle}`,
    variables: {
      userName: email.split("@")[0],
      groupName,
      disputeTitle,
      votingDeadline,
    },
  });
}

/**
 * Send dispute resolution notification
 */
export async function sendDisputeResolvedNotification(
  userId: string,
  email: string,
  phone: string,
  groupName: string,
  disputeTitle: string,
  resolution: string
) {
  const factory = getNotificationFactory();

  return factory.send({
    recipientId: userId,
    recipientEmail: email,
    recipientPhone: phone,
    type: NotificationType.DISPUTE_RESOLVED,
       channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.MEDIUM,
    message: `Dispute in ${groupName} has been resolved`,
    variables: {
      userName: email.split("@")[0],
      groupName,
      disputeTitle,
      resolution,
    },
  });
}

/**
 * Send group invitation
 */
export async function sendGroupInvitation(
  userId: string,
  email: string,
  phone: string,
  groupName: string,
  inviteCode: string,
  acceptUrl?: string
) {
  const factory = getNotificationFactory();

  return factory.send({
    recipientId: userId,
    recipientEmail: email,
    recipientPhone: phone,
    type: NotificationType.GROUP_INVITATION,
    channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.MEDIUM,
    subject: `You're invited to join ${groupName}`,
    message: `You've been invited to join ${groupName}`,
    variables: {
      userName: email.split("@")[0],
      groupName,
      inviteCode,
      acceptUrl: acceptUrl || `https://mbolepay.com/join/${inviteCode}`,
    },
  });
}

/**
 * Send member joined notification to group
 */
export async function sendMemberJoinedNotification(
  groupMembers: Array<{
    userId: string;
    email: string;
    phone: string;
  }>,
  newMemberName: string,
  groupName: string
) {
  const factory = getNotificationFactory();

  const payloads: NotificationPayload[] = groupMembers.map((member) => ({
    recipientId: member.userId,
    recipientEmail: member.email,
    recipientPhone: member.phone,
    type: NotificationType.MEMBER_JOINED,
      channels: [NotificationChannel.EMAIL],
    priority: NotificationPriority.LOW,
    message: `${newMemberName} joined ${groupName}`,
    variables: {
      userName: newMemberName,
      groupName,
    },
  }));

  return factory.sendBatch(payloads);
}

/**
 * Send custom notification
 */
export async function sendCustomNotification(payload: NotificationPayload) {
  const factory = getNotificationFactory();
  return factory.send(payload);
}

/**
 * Send batch notifications
 */
export async function sendBatchNotifications(payloads: NotificationPayload[]) {
  const factory = getNotificationFactory();
  return factory.sendBatch(payloads);
}

/**
 * Check notification services health
 */
export async function checkNotificationServices() {
  const factory = getNotificationFactory();
  return factory.getHealthStatus();
}
