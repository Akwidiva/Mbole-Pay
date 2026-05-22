import { prisma } from "@/lib/db";
import { emailService } from "./email-service";
import { smsService } from "./sms-service";

export interface NotificationEvent {
  type:
    | "PAYMENT_SUCCESS"
    | "PAYMENT_FAILED"
    | "PAYOUT_SCHEDULED"
    | "DISPUTE_FILED"
    | "VOTING_REMINDER"
    | "CONTRIBUTION_REMINDER"
    | "DISPUTE_RESOLVED";
  userId?: string;
  groupId?: string;
  data: Record<string, any>;
}

export const notificationEventHandler = {
  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string) {
    try {
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // Return defaults if not found
      return prefs || {
        userId,
        emailPaymentSuccess: true,
        emailPaymentFailed: true,
        emailPayoutScheduled: true,
        emailDisputeFiled: true,
        emailVotingReminder: true,
        emailContributionReminder: true,
        smsPaymentSuccess: true,
        smsPaymentFailed: true,
        smsPayoutScheduled: true,
        smsDisputeFiled: false,
        smsVotingReminder: true,
        smsContributionReminder: true,
        notificationQuietHours: false,
        quietHoursStart: "22:00",
        quietHoursEnd: "08:00",
      };
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      return null;
    }
  },

  /**
   * Check if we should send notifications (quiet hours check)
   */
  isInQuietHours(prefs: any): boolean {
    if (!prefs.notificationQuietHours) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const [startHour, startMin] = prefs.quietHoursStart.split(":").map(Number);
    const [endHour, endMin] = prefs.quietHoursEnd.split(":").map(Number);
    const startTime = startHour * 100 + startMin;
    const endTime = endHour * 100 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      return currentTime >= startTime || currentTime < endTime;
    }
  },

  /**
   * Get user contact info (email and phone)
   */
  async getUserContact(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true },
      });
      return user;
    } catch (error) {
      console.error("Error fetching user contact:", error);
      return null;
    }
  },

  /**
   * Handle notification event
   */
  async handleEvent(event: NotificationEvent) {
    console.log(`Processing notification event: ${event.type}`);

    try {
      switch (event.type) {
        case "PAYMENT_SUCCESS":
          await this.handlePaymentSuccess(event);
          break;
        case "PAYMENT_FAILED":
          await this.handlePaymentFailed(event);
          break;
        case "PAYOUT_SCHEDULED":
          await this.handlePayoutScheduled(event);
          break;
        case "DISPUTE_FILED":
          await this.handleDisputeFiled(event);
          break;
        case "VOTING_REMINDER":
          await this.handleVotingReminder(event);
          break;
        case "CONTRIBUTION_REMINDER":
          await this.handleContributionReminder(event);
          break;
        default:
          console.warn(`Unknown notification type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error handling notification event: ${error}`);
    }
  },

  async handlePaymentSuccess(event: NotificationEvent) {
    const { userId, data } = event;
    if (!userId) return;

    const contact = await this.getUserContact(userId);
    if (!contact?.email) return;

    const prefs = await this.getPreferences(userId);
    if (this.isInQuietHours(prefs)) return;

    if (prefs?.emailPaymentSuccess) {
      await emailService.sendPaymentConfirmation(contact.email, {
        paymentId: data.paymentId,
        amount: data.amount,
        currency: data.currency,
        groupName: data.groupName,
        provider: data.provider,
        date: new Date(),
      });
    }

    if (prefs?.smsPaymentSuccess && contact.phone && smsService.isConfigured()) {
      await smsService.sendPaymentConfirmationSMS(contact.phone, {
        amount: data.amount,
        currency: data.currency,
        groupName: data.groupName,
        paymentId: data.paymentId,
      });
    }
  },

  async handlePaymentFailed(event: NotificationEvent) {
    const { userId, data } = event;
    if (!userId) return;

    const contact = await this.getUserContact(userId);
    if (!contact?.email) return;

    const prefs = await this.getPreferences(userId);
    if (this.isInQuietHours(prefs)) return;

    if (prefs?.emailPaymentFailed) {
      await emailService.sendPaymentFailed(contact.email, {
        amount: data.amount,
        currency: data.currency,
        groupName: data.groupName,
        errorMessage: data.errorMessage,
        retryUrl: `https://mbolepay.com/groups/${data.groupId}/pay`,
      });
    }

    if (prefs?.smsPaymentFailed && contact.phone && smsService.isConfigured()) {
      await smsService.sendPaymentFailedSMS(contact.phone, {
        amount: data.amount,
        currency: data.currency,
        groupName: data.groupName,
        errorMessage: data.errorMessage,
      });
    }
  },

  async handlePayoutScheduled(event: NotificationEvent) {
    const { userId, data } = event;
    if (!userId) return;

    const contact = await this.getUserContact(userId);
    if (!contact?.email) return;

    const prefs = await this.getPreferences(userId);
    if (this.isInQuietHours(prefs)) return;

    if (prefs?.emailPayoutScheduled) {
      await emailService.sendPayoutNotification(contact.email, {
        amount: data.amount,
        currency: data.currency,
        groupName: data.groupName,
        scheduledDate: data.scheduledDate,
        payoutUrl: `https://mbolepay.com/groups/${data.groupId}/payouts`,
      });
    }

    if (prefs?.smsPayoutScheduled && contact.phone && smsService.isConfigured()) {
      await smsService.sendPayoutSMS(contact.phone, {
        amount: data.amount,
        currency: data.currency,
        groupName: data.groupName,
        scheduledDate: data.scheduledDate,
      });
    }
  },

  async handleDisputeFiled(event: NotificationEvent) {
    const { groupId, data } = event;
    if (!groupId) return;

    // Get all group members
    const members = await prisma.membership.findMany({
      where: { groupId },
      select: { userId: true },
    });

    // Send to each member
    for (const member of members) {
      const contact = await this.getUserContact(member.userId);
      if (!contact?.email) continue;

      const prefs = await this.getPreferences(member.userId);
      if (this.isInQuietHours(prefs)) continue;

      if (prefs?.emailDisputeFiled) {
        await emailService.sendDisputeNotification(contact.email, {
          disputeTitle: data.disputeTitle,
          groupName: data.groupName,
          filedBy: data.filedBy,
          disputeUrl: `https://mbolepay.com/groups/${groupId}/disputes/${data.disputeId}`,
        });
      }

      if (prefs?.smsDisputeFiled && contact.phone && smsService.isConfigured()) {
        await smsService.sendDisputeNotificationSMS(contact.phone, {
          groupName: data.groupName,
          disputeTitle: data.disputeTitle,
        });
      }
    }
  },

  async handleVotingReminder(event: NotificationEvent) {
    const { groupId, data } = event;
    if (!groupId) return;

    // Get all group members
    const members = await prisma.membership.findMany({
      where: { groupId },
      select: { userId: true },
    });

    // Send to each member who hasn't voted yet
    for (const member of members) {
      // In production, check if user already voted
      const contact = await this.getUserContact(member.userId);
      if (!contact?.email) continue;

      const prefs = await this.getPreferences(member.userId);
      if (this.isInQuietHours(prefs)) continue;

      if (prefs?.emailVotingReminder) {
        await emailService.sendVotingReminder(contact.email, {
          disputeTitle: data.disputeTitle,
          groupName: data.groupName,
          hoursLeft: data.hoursLeft,
          votingUrl: `https://mbolepay.com/groups/${groupId}/disputes/${data.disputeId}`,
        });
      }

      if (prefs?.smsVotingReminder && contact.phone && smsService.isConfigured()) {
        await smsService.sendVotingReminderSMS(contact.phone, {
          groupName: data.groupName,
          hoursLeft: data.hoursLeft,
        });
      }
    }
  },

  async handleContributionReminder(event: NotificationEvent) {
    const { userId, data } = event;
    if (!userId) return;

    const contact = await this.getUserContact(userId);
    if (!contact?.email) return;

    const prefs = await this.getPreferences(userId);
    if (this.isInQuietHours(prefs)) return;

    const daysUntilDue = Math.ceil(
      (new Date(data.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (prefs?.emailContributionReminder) {
      await emailService.sendContributionReminder(contact.email, {
        amount: data.amount,
        currency: data.currency,
        groupName: data.groupName,
        dueDate: data.dueDate,
        paymentUrl: `https://mbolepay.com/groups/${data.groupId}/pay`,
      });
    }

    if (
      prefs?.smsContributionReminder &&
      contact.phone &&
      smsService.isConfigured()
    ) {
      await smsService.sendContributionReminderSMS(contact.phone, {
        amount: data.amount,
        currency: data.currency,
        groupName: data.groupName,
        daysUntilDue,
      });
    }
  },
};
