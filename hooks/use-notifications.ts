"use client";

import { useState, useCallback } from "react";

export function useNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a notification event
   */
  const sendNotification = useCallback(
    async (
      type:
        | "PAYMENT_SUCCESS"
        | "PAYMENT_FAILED"
        | "PAYOUT_SCHEDULED"
        | "DISPUTE_FILED"
        | "VOTING_REMINDER"
        | "CONTRIBUTION_REMINDER",
      data: {
        userId?: string;
        groupId?: string;
        [key: string]: any;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/notifications/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            userId: data.userId,
            groupId: data.groupId,
            data: data,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to send notification");
        }

        return result.data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Send payment confirmation notification
   */
  const notifyPaymentSuccess = useCallback(
    async (userId: string, paymentData: any) => {
      return sendNotification("PAYMENT_SUCCESS", {
        userId,
        groupId: paymentData.groupId,
        paymentId: paymentData.paymentId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        groupName: paymentData.groupName,
        provider: paymentData.provider,
      });
    },
    [sendNotification]
  );

  /**
   * Send payment failed notification
   */
  const notifyPaymentFailed = useCallback(
    async (userId: string, paymentData: any) => {
      return sendNotification("PAYMENT_FAILED", {
        userId,
        groupId: paymentData.groupId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        groupName: paymentData.groupName,
        errorMessage: paymentData.errorMessage,
      });
    },
    [sendNotification]
  );

  /**
   * Send payout scheduled notification
   */
  const notifyPayoutScheduled = useCallback(
    async (userId: string, payoutData: any) => {
      return sendNotification("PAYOUT_SCHEDULED", {
        userId,
        groupId: payoutData.groupId,
        amount: payoutData.amount,
        currency: payoutData.currency,
        groupName: payoutData.groupName,
        scheduledDate: payoutData.scheduledDate,
      });
    },
    [sendNotification]
  );

  /**
   * Notify group members of new dispute
   */
  const notifyDisputeFiled = useCallback(
    async (groupId: string, disputeData: any) => {
      return sendNotification("DISPUTE_FILED", {
        groupId,
        disputeId: disputeData.disputeId,
        disputeTitle: disputeData.disputeTitle,
        groupName: disputeData.groupName,
        filedBy: disputeData.filedBy,
      });
    },
    [sendNotification]
  );

  /**
   * Send voting reminder to group members
   */
  const notifyVotingReminder = useCallback(
    async (groupId: string, reminderData: any) => {
      return sendNotification("VOTING_REMINDER", {
        groupId,
        disputeId: reminderData.disputeId,
        disputeTitle: reminderData.disputeTitle,
        groupName: reminderData.groupName,
        hoursLeft: reminderData.hoursLeft,
      });
    },
    [sendNotification]
  );

  /**
   * Send contribution reminder to user
   */
  const notifyContributionReminder = useCallback(
    async (userId: string, reminderData: any) => {
      return sendNotification("CONTRIBUTION_REMINDER", {
        userId,
        groupId: reminderData.groupId,
        amount: reminderData.amount,
        currency: reminderData.currency,
        groupName: reminderData.groupName,
        dueDate: reminderData.dueDate,
      });
    },
    [sendNotification]
  );

  return {
    loading,
    error,
    sendNotification,
    notifyPaymentSuccess,
    notifyPaymentFailed,
    notifyPayoutScheduled,
    notifyDisputeFiled,
    notifyVotingReminder,
    notifyContributionReminder,
  };
}
