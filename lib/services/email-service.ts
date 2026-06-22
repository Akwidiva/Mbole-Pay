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
   * Send KYC approved notification
   */
  async sendKycApproved(email: string, data: { userName: string }): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #166534;">Identity Verified ✓</h2>
        <p>Hi ${data.userName},</p>
        <p>Great news — your identity documents have been reviewed and <strong>approved</strong>.</p>
        <p>Your Mbole Pay account is now fully active. You can join and manage savings groups, make contributions, and receive payouts.</p>
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 4px; margin: 24px 0;">
          <p style="margin: 0; color: #166534; font-weight: 600;">You're all set. Welcome to Mbole Pay.</p>
        </div>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2026 Mbole Pay — Community Savings Platform</p>
      </div>
    `
    return this.sendEmail({
      to: email,
      subject: "Your Mbole Pay identity has been verified",
      html,
      text: `Hi ${data.userName}, your identity documents have been approved. Your account is now fully active.`,
    })
  },

  /**
   * Send KYC rejected notification
   */
  async sendKycRejected(
    email: string,
    data: { userName: string; reason: string }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #991b1b;">Verification Unsuccessful</h2>
        <p>Hi ${data.userName},</p>
        <p>Unfortunately, we could not verify your identity with the documents submitted.</p>
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #991b1b;">Reason:</p>
          <p style="margin: 0; color: #7f1d1d;">${data.reason}</p>
        </div>
        <p>Please sign in and re-upload your documents addressing the issue above.</p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2026 Mbole Pay — Community Savings Platform</p>
      </div>
    `
    return this.sendEmail({
      to: email,
      subject: "Action required — Mbole Pay identity verification",
      html,
      text: `Hi ${data.userName}, your identity verification was unsuccessful. Reason: ${data.reason}. Please sign in and resubmit.`,
    })
  },

  /**
   * Send email verification OTP (used at signup)
   */
  async sendEmailVerification(
    email: string,
    data: { otp: string; userName: string }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Verify your Mbole Pay account</h2>
        <p>Hi ${data.userName},</p>
        <p>Welcome to Mbole Pay! Enter this code to verify your email address and activate your account.</p>
        <p>The code expires in <strong>10 minutes</strong>.</p>
        <div style="background: #f0f4ff; border-radius: 12px; padding: 32px; margin: 24px 0; text-align: center;">
          <p style="font-size: 42px; font-weight: 700; letter-spacing: 12px; margin: 0; color: #1e3a8a; font-family: monospace;">${data.otp}</p>
        </div>
        <p style="color: #555;">If you didn't create a Mbole Pay account, ignore this email.</p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2026 Mbole Pay — Community Savings Platform</p>
      </div>
    `
    return this.sendEmail({
      to: email,
      subject: "Verify your Mbole Pay account",
      html,
      text: `Your Mbole Pay verification code is: ${data.otp}. It expires in 10 minutes.`,
    })
  },

  /**
   * Send MFA OTP email
   */
  async sendMfaOtp(
    email: string,
    data: { otp: string; userName: string }
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Your Mbole Pay sign-in code</h2>
        <p>Hi ${data.userName},</p>
        <p>Enter this code to complete your sign-in. It expires in <strong>5 minutes</strong>.</p>
        <div style="background: #f0f4ff; border-radius: 12px; padding: 32px; margin: 24px 0; text-align: center;">
          <p style="font-size: 42px; font-weight: 700; letter-spacing: 12px; margin: 0; color: #1e3a8a; font-family: monospace;">${data.otp}</p>
        </div>
        <p style="color: #555;">This code was requested for a high-value Njangi group login. If you did not request it, ignore this email — your account is safe.</p>
        <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2026 Mbole Pay — Community Savings Platform</p>
      </div>
    `
    return this.sendEmail({
      to: email,
      subject: "Your Mbole Pay sign-in code",
      html,
      text: `Your Mbole Pay sign-in code is: ${data.otp}. It expires in 5 minutes.`,
    })
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

  async sendRoleAssigned(email: string, data: { userName: string; role: string; groupName: string; assignedBy: string }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `You've been made ${data.role} — ${data.groupName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Role Update 🎖️</h2>
        <p>Hi ${data.userName},</p>
        <p><strong>${data.assignedBy}</strong> has appointed you as <strong>${data.role}</strong> in the group <strong>"${data.groupName}"</strong>.</p>
        <hr style="margin:30px 0;border:none;border-top:1px solid #ddd">
        <p style="color:#999;font-size:12px">© 2026 Mbole Pay</p>
      </div>`,
      text: `You've been made ${data.role} in "${data.groupName}" by ${data.assignedBy}.`,
    });
  },

  async sendRoleRemoved(email: string, data: { userName: string; oldRole: string; newRole: string; groupName: string; changedBy: string }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Role changed in ${data.groupName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Role Change</h2>
        <p>Hi ${data.userName},</p>
        <p>Your role in <strong>"${data.groupName}"</strong> has been changed from <strong>${data.oldRole}</strong> to <strong>${data.newRole}</strong> by ${data.changedBy}.</p>
        <hr style="margin:30px 0;border:none;border-top:1px solid #ddd">
        <p style="color:#999;font-size:12px">© 2026 Mbole Pay</p>
      </div>`,
      text: `Your role in "${data.groupName}" was changed from ${data.oldRole} to ${data.newRole} by ${data.changedBy}.`,
    });
  },

  async sendMemberRemoved(email: string, data: { userName: string; groupName: string; removedBy: string }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `You've been removed from ${data.groupName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Group Membership Update</h2>
        <p>Hi ${data.userName},</p>
        <p>You have been removed from the group <strong>"${data.groupName}"</strong> by ${data.removedBy}.</p>
        <p>If you believe this was a mistake, please contact the group admin.</p>
        <hr style="margin:30px 0;border:none;border-top:1px solid #ddd">
        <p style="color:#999;font-size:12px">© 2026 Mbole Pay</p>
      </div>`,
      text: `You have been removed from "${data.groupName}" by ${data.removedBy}.`,
    });
  },

  async sendGroupBroadcast(email: string, data: { userName: string; groupName: string; senderName: string; message: string }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Message from ${data.senderName} · ${data.groupName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Group Message 📣</h2>
        <p>Hi ${data.userName},</p>
        <p><strong>${data.senderName}</strong> sent a message to <strong>"${data.groupName}"</strong>:</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;border-left:4px solid #1976d2;margin:16px 0">
          <p style="margin:0">${data.message}</p>
        </div>
        <hr style="margin:30px 0;border:none;border-top:1px solid #ddd">
        <p style="color:#999;font-size:12px">© 2026 Mbole Pay</p>
      </div>`,
      text: `${data.senderName} in "${data.groupName}": ${data.message}`,
    });
  },

  async sendPaymentConfirmed(email: string, data: { userName: string; amount: number; groupName: string }): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Payment confirmed — ${data.groupName}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2>Payment Confirmed ✅</h2>
        <p>Hi ${data.userName},</p>
        <p>Your contribution of <strong>XAF ${data.amount.toLocaleString()}</strong> to <strong>"${data.groupName}"</strong> has been received and confirmed.</p>
        <hr style="margin:30px 0;border:none;border-top:1px solid #ddd">
        <p style="color:#999;font-size:12px">© 2026 Mbole Pay</p>
      </div>`,
      text: `Your payment of XAF ${data.amount.toLocaleString()} to "${data.groupName}" was confirmed.`,
    });
  },
};
