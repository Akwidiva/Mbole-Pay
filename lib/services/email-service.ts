import nodemailer from "nodemailer";

// Email service using nodemailer (works with any SMTP provider)
// For production, use SendGrid or AWS SES

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getEnv(name: string, fallbackName?: string) {
  return process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
}

// Initialize transporter
const transporter = nodemailer.createTransport({
  host: getEnv("SMTP_HOST", "EMAIL_HOST") || "localhost",
  port: parseInt(getEnv("SMTP_PORT", "EMAIL_PORT") || "587"),
  secure: (getEnv("SMTP_SECURE", "EMAIL_SECURE") || "false") === "true",
  auth: getEnv("SMTP_USER", "EMAIL_USER")
    ? {
        user: getEnv("SMTP_USER", "EMAIL_USER"),
        pass: getEnv("SMTP_PASS", "EMAIL_PASSWORD"),
      }
    : undefined,
});

export const emailService = {
  /**
   * Send raw email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      console.log(`[emailService] Sending email to: ${options.to}, subject: ${options.subject}`);
      const info = await transporter.sendMail({
        from: getEnv("SMTP_FROM", "EMAIL_FROM") || "noreply@mbolepay.com",
        ...options,
      });
      console.log("✅ Email sent successfully:", { to: options.to, messageId: info.messageId, response: info.response });
      return true;
    } catch (error) {
      console.error("❌ Email send failed:", { to: options.to, error: String(error) });
      return false;
    }
  },

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    email: string,
    data: {
      paymentId: string;
      amount: number;
      currency: string;
      groupName: string;
      provider: string;
      date: Date;
    }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmation ✅</h2>
        
        <p>Dear Member,</p>
        
        <p>Your payment has been successfully received and recorded.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Payment Details</strong></p>
          <p>Receipt ID: ${data.paymentId}</p>
          <p>Amount: ${data.amount.toLocaleString()} ${data.currency}</p>
          <p>Group: ${data.groupName}</p>
          <p>Provider: ${data.provider === "MTN_MOMO" ? "MTN Mobile Money" : "Orange Money"}</p>
          <p>Date: ${new Date(data.date).toLocaleString()}</p>
        </div>
        
        <p>You can download your receipt anytime from your payment history.</p>
        
        <p>Thank you for your contribution!</p>
        
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">
          © 2026 Mbole Pay - Community Savings Platform<br>
          <a href="https://mbolepay.com">Visit our website</a> | 
          <a href="https://mbolepay.com/support">Support</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Payment Confirmation - ${data.groupName}`,
      html,
      text: `Payment confirmed for ${data.groupName}. Amount: ${data.amount} ${data.currency}`,
    });
  },

  /**
   * Send payment failed email
   */
  async sendPaymentFailed(
    email: string,
    data: {
      amount: number;
      currency: string;
      groupName: string;
      errorMessage: string;
      retryUrl: string;
    }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Failed ⚠️</h2>
        
        <p>Dear Member,</p>
        
        <p>Unfortunately, your payment could not be processed.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Error Details</strong></p>
          <p>Amount: ${data.amount.toLocaleString()} ${data.currency}</p>
          <p>Group: ${data.groupName}</p>
          <p>Reason: ${data.errorMessage}</p>
        </div>
        
        <p>Please try again:</p>
        <p>
          <a href="${data.retryUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">
            Retry Payment
          </a>
        </p>
        
        <p>If the problem persists, please contact our support team.</p>
        
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">
          © 2026 Mbole Pay - Community Savings Platform<br>
          <a href="https://mbolepay.com/support">Contact Support</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Payment Failed - ${data.groupName}`,
      html,
      text: `Payment failed for ${data.groupName}. Amount: ${data.amount} ${data.currency}. Error: ${data.errorMessage}`,
    });
  },

  /**
   * Send payout notification
   */
  async sendPayoutNotification(
    email: string,
    data: {
      amount: number;
      currency: string;
      groupName: string;
      scheduledDate: Date;
      payoutUrl: string;
    }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payout Scheduled 💰</h2>
        
        <p>Dear Member,</p>
        
        <p>Great news! Your payout has been scheduled.</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p><strong>Payout Details</strong></p>
          <p>Amount: ${data.amount.toLocaleString()} ${data.currency}</p>
          <p>Group: ${data.groupName}</p>
          <p>Scheduled Date: ${new Date(data.scheduledDate).toLocaleDateString()}</p>
        </div>
        
        <p>
          <a href="${data.payoutUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">
            View Payout Details
          </a>
        </p>
        
        <p>Your funds will be transferred to your registered mobile money account on the scheduled date.</p>
        
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">
          © 2026 Mbole Pay - Community Savings Platform<br>
          <a href="https://mbolepay.com">Visit our website</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Payout Scheduled - ${data.groupName}`,
      html,
      text: `Your payout of ${data.amount} ${data.currency} is scheduled for ${new Date(data.scheduledDate).toLocaleDateString()}`,
    });
  },

  /**
   * Send dispute filed notification
   */
  async sendDisputeNotification(
    email: string,
    data: {
      disputeTitle: string;
      groupName: string;
      filedBy: string;
      disputeUrl: string;
    }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Dispute in Your Group ⚖️</h2>
        
        <p>Dear Member,</p>
        
        <p>A new dispute has been filed in your group and requires your attention.</p>
        
        <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <p><strong>Dispute Details</strong></p>
          <p>Title: ${data.disputeTitle}</p>
          <p>Group: ${data.groupName}</p>
          <p>Filed by: ${data.filedBy}</p>
        </div>
        
        <p>Please review the details and cast your vote:</p>
        <p>
          <a href="${data.disputeUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">
            View & Vote on Dispute
          </a>
        </p>
        
        <p>Your vote is important to ensure fair group decisions.</p>
        
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">
          © 2026 Mbole Pay - Community Savings Platform<br>
          <a href="https://mbolepay.com/support">Contact Support</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `New Dispute - ${data.groupName}`,
      html,
      text: `A new dispute "${data.disputeTitle}" has been filed in ${data.groupName}. Please review and vote.`,
    });
  },

  /**
   * Send voting reminder email
   */
  async sendVotingReminder(
    email: string,
    data: {
      disputeTitle: string;
      groupName: string;
      hoursLeft: number;
      votingUrl: string;
    }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Voting Reminder ⏰</h2>
        
        <p>Dear Member,</p>
        
        <p>Don't forget! You have ${data.hoursLeft} hours left to vote on an active dispute.</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <p><strong>Dispute Details</strong></p>
          <p>Title: ${data.disputeTitle}</p>
          <p>Group: ${data.groupName}</p>
          <p>Time Left: ${data.hoursLeft} hours</p>
        </div>
        
        <p>
          <a href="${data.votingUrl}" style="background-color: #ff9800; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">
            Cast Your Vote Now
          </a>
        </p>
        
        <p>Your vote matters! Help your group make fair decisions.</p>
        
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">
          © 2026 Mbole Pay - Community Savings Platform<br>
          <a href="https://mbolepay.com/support">Contact Support</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Voting Reminder - ${data.groupName}`,
      html,
      text: `You have ${data.hoursLeft} hours left to vote on "${data.disputeTitle}" in ${data.groupName}`,
    });
  },

  /**
   * Send contribution reminder
   */
  async sendContributionReminder(
    email: string,
    data: {
      amount: number;
      currency: string;
      groupName: string;
      dueDate: Date;
      paymentUrl: string;
    }
  ): Promise<boolean> {
    const daysUntilDue = Math.ceil(
      (new Date(data.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Contribution Due Soon 💵</h2>
        
        <p>Dear Member,</p>
        
        <p>Friendly reminder: Your contribution to ${data.groupName} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}.</p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <p><strong>Contribution Details</strong></p>
          <p>Amount: ${data.amount.toLocaleString()} ${data.currency}</p>
          <p>Group: ${data.groupName}</p>
          <p>Due Date: ${new Date(data.dueDate).toLocaleDateString()}</p>
        </div>
        
        <p>
          <a href="${data.paymentUrl}" style="background-color: #1976d2; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; display: inline-block;">
            Make Payment Now
          </a>
        </p>
        
        <p>Paying on time helps your group stay organized and builds trust among members.</p>
        
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">
          © 2026 Mbole Pay - Community Savings Platform<br>
          <a href="https://mbolepay.com/support">Contact Support</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Contribution Reminder - ${data.groupName}`,
      html,
      text: `Your contribution of ${data.amount} ${data.currency} to ${data.groupName} is due on ${new Date(data.dueDate).toLocaleDateString()}`,
    });
  },
};
