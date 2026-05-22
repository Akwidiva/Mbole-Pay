// SMS Service using Twilio
// Install: npm install twilio
// Configure: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

interface SMSOptions {
  to: string;
  message: string;
}

// Initialize Twilio client
let twilioClient: any = null;

function getTwilioClient() {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID) {
    const twilio = require("twilio");
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
}

export const smsService = {
  /**
   * Check if SMS is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  },

  /**
   * Send raw SMS
   */
  async sendSMS(options: SMSOptions): Promise<boolean> {
    const client = getTwilioClient();
    if (!client) {
      console.warn("Twilio not configured. SMS not sent.");
      return false;
    }

    try {
      await client.messages.create({
        body: options.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: options.to,
      });
      return true;
    } catch (error) {
      console.error("SMS send failed:", error);
      return false;
    }
  },

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmationSMS(
    phoneNumber: string,
    data: {
      amount: number;
      currency: string;
      groupName: string;
      paymentId: string;
    }
  ): Promise<boolean> {
    const message = `Mbole Pay: Payment confirmed ✅\n${data.amount} ${data.currency} for ${data.groupName}\nRef: ${data.paymentId}\nThank you!`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  },

  /**
   * Send payment failed SMS
   */
  async sendPaymentFailedSMS(
    phoneNumber: string,
    data: {
      amount: number;
      currency: string;
      groupName: string;
      errorMessage: string;
    }
  ): Promise<boolean> {
    const message = `Mbole Pay: Payment failed ⚠️\n${data.amount} ${data.currency} for ${data.groupName}\nError: ${data.errorMessage}\nPlease retry or contact support.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  },

  /**
   * Send payout notification SMS
   */
  async sendPayoutSMS(
    phoneNumber: string,
    data: {
      amount: number;
      currency: string;
      groupName: string;
      scheduledDate: Date;
    }
  ): Promise<boolean> {
    const date = new Date(data.scheduledDate).toLocaleDateString();
    const message = `Mbole Pay: Payout scheduled 💰\n${data.amount} ${data.currency} from ${data.groupName}\nDate: ${date}\nCheck your account for details.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  },

  /**
   * Send voting reminder SMS
   */
  async sendVotingReminderSMS(
    phoneNumber: string,
    data: {
      groupName: string;
      hoursLeft: number;
    }
  ): Promise<boolean> {
    const message = `Mbole Pay: Vote reminder ⏰\nYou have ${data.hoursLeft}h to vote on a dispute in ${data.groupName}.\nYour vote matters! Open app to vote.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  },

  /**
   * Send contribution reminder SMS
   */
  async sendContributionReminderSMS(
    phoneNumber: string,
    data: {
      amount: number;
      currency: string;
      groupName: string;
      daysUntilDue: number;
    }
  ): Promise<boolean> {
    const message = `Mbole Pay: Payment reminder 💵\n${data.amount} ${data.currency} due in ${data.daysUntilDue}d for ${data.groupName}.\nPay now to stay on track!`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  },

  /**
   * Send dispute notification SMS
   */
  async sendDisputeNotificationSMS(
    phoneNumber: string,
    data: {
      groupName: string;
      disputeTitle: string;
    }
  ): Promise<boolean> {
    const message = `Mbole Pay: New dispute ⚖️\n"${data.disputeTitle}" in ${data.groupName}.\nVote now to help resolve fairly.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  },

  /**
   * Send daily summary SMS
   */
  async sendDailySummarySMS(
    phoneNumber: string,
    data: {
      pendingAmount: number;
      currency: string;
      pendingCount: number;
      groupCount: number;
      dueToday: number;
    }
  ): Promise<boolean> {
    const message = `Mbole Pay Daily Summary:\n💵 Pending: ${data.pendingAmount} ${data.currency} (${data.pendingCount} items)\n👥 Groups: ${data.groupCount}\n⏰ Due today: ${data.dueToday}\nOpen app for details.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
    });
  },
};
