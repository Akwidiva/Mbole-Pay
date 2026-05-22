/**
 * Notification Factory
 * Centralized management of email and SMS services
 * Allows sending notifications through multiple channels
 */

import EmailService from "./email-service";
import SmsService from "./sms-service";
import {
  NotificationPayload,
  NotificationChannel,
  NotificationType,
  EmailOptions,
  SmsOptions,
  SendEmailResponse,
  SendSmsResponse,
  IEmailService,
  ISmsService,
  NOTIFICATION_VARIABLES,
} from "@/types/notifications";

export class NotificationFactory {
  private emailService: IEmailService;
  private smsService: ISmsService;
  private templates: Map<NotificationType, Record<string, string>> = new Map();

  constructor(emailService?: IEmailService, smsService?: ISmsService) {
    this.emailService = emailService || new EmailService();
    this.smsService = smsService || new SmsService();
    this.initializeTemplates();
  }

  /**
   * Send notification through one or more channels
   */
  async send(payload: NotificationPayload): Promise<{
    email?: SendEmailResponse;
    sms?: SendSmsResponse;
  }> {
    const results: {
      email?: SendEmailResponse;
      sms?: SendSmsResponse;
    } = {};

    try {
      for (const channel of payload.channels) {
        switch (channel) {
          case NotificationChannel.EMAIL:
            if (payload.recipientEmail) {
              const emailOptions = this.buildEmailOptions(payload);
              results.email = await this.emailService.send(emailOptions);
            }
            break;

          case NotificationChannel.SMS:
            if (payload.recipientPhone) {
              const smsOptions = this.buildSmsOptions(payload);
              results.sms = await this.smsService.send(smsOptions);
            }
            break;

          case NotificationChannel.PUSH:
            // TODO: Implement push notifications
            console.log("📱 Push notifications not yet implemented");
            break;

          case NotificationChannel.IN_APP:
            // TODO: Implement in-app notifications (store in DB)
            console.log("🔔 In-app notifications not yet implemented");
            break;
        }
      }

      return results;
    } catch (error) {
      console.error("❌ Error sending notification:", error);
      throw error;
    }
  }

  /**
   * Send batch notifications
   */
  async sendBatch(payloads: NotificationPayload[]): Promise<
    Array<{
      email?: SendEmailResponse;
      sms?: SendSmsResponse;
    }>
  > {
    return Promise.all(payloads.map((payload) => this.send(payload)));
  }

  /**
   * Build email options from notification payload
   */
  private buildEmailOptions(payload: NotificationPayload): EmailOptions {
    const template = this.getTemplate(payload.type, "email");
    const html = this.renderTemplate(template, payload.variables || {});

    return {
      to: payload.recipientEmail!,
      subject:
        payload.subject ||
        this.getEmailSubject(payload.type, payload.variables),
      html,
      text: payload.message,
    };
  }

  /**
   * Build SMS options from notification payload
   */
  private buildSmsOptions(payload: NotificationPayload): SmsOptions {
    const template = this.getTemplate(payload.type, "sms");
    const message = this.renderTemplate(
      template,
      payload.variables || {}
    );

    return {
      phoneNumber: (this.smsService as SmsService).formatPhoneNumber(
        payload.recipientPhone!
      ),
      message:
        message.length <= 160 ? message : message.substring(0, 157) + "...",
    };
  }

  /**
   * Render template with variables
   */
  private renderTemplate(
    template: string,
    variables: Record<string, any>
  ): string {
    let result = template;

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, String(variables[key]));
    });

    return result;
  }

  /**
   * Get template for notification type
   */
  private getTemplate(
    type: NotificationType,
    channel: "email" | "sms"
  ): string {
    return this.templates.get(type)?.[channel] || this.getDefaultTemplate(type, channel);
  }

  /**
   * Get email subject for notification type
   */
  private getEmailSubject(
    type: NotificationType,
    variables?: Record<string, any>
  ): string {
    const subjects: Record<NotificationType, string> = {
      [NotificationType.CONTRIBUTION_DUE]:
        "💰 Contribution Due - {{groupName}}",
      [NotificationType.CONTRIBUTION_OVERDUE]:
        "⚠️ Contribution Overdue - {{groupName}}",
      [NotificationType.PAYMENT_RECEIVED]:
        "✅ Payment Received - {{groupName}}",
      [NotificationType.PAYMENT_FAILED]: "❌ Payment Failed - {{groupName}}",
      [NotificationType.PAYOUT_AVAILABLE]:
        "💸 Payout Available - {{groupName}}",
      [NotificationType.PAYOUT_SCHEDULED]:
        "📅 Payout Scheduled - {{groupName}}",
      [NotificationType.DISPUTE_OPENED]: "⚖️ New Dispute - {{groupName}}",
      [NotificationType.DISPUTE_RESOLUTION_VOTE]:
        "🗳️ Vote on Dispute - {{groupName}}",
      [NotificationType.DISPUTE_RESOLVED]:
        "✅ Dispute Resolved - {{groupName}}",
      [NotificationType.GROUP_INVITATION]: "👋 You're Invited to {{groupName}}",
      [NotificationType.MEMBER_JOINED]:
        "👤 {{userName}} Joined {{groupName}}",
      [NotificationType.CUSTOM]: "Notification",
    };

    let subject = subjects[type] || "Notification";
    if (variables) {
      subject = this.renderTemplate(subject, variables);
    }
    return subject;
  }

  /**
   * Get default template based on notification type
   */
  private getDefaultTemplate(
    type: NotificationType,
    channel: "email" | "sms"
  ): string {
    if (channel === "sms") {
      return this.defaultSmsTemplates[type] || "{{message}}";
    }

    return this.defaultEmailTemplates[type] || `<p>{{message}}</p>`;
  }

  /**
   * Default SMS templates (160 char limit)
   */
  private defaultSmsTemplates: Record<NotificationType, string> = {
    [NotificationType.CONTRIBUTION_DUE]:
      "Hi {{userName}}, your {{amount}} {{currency}} contribution to {{groupName}} is due on {{dueDate}}.",
    [NotificationType.CONTRIBUTION_OVERDUE]:
      "⚠️ {{userName}}, your {{amount}} {{currency}} contribution to {{groupName}} is {{overdueBy}} overdue.",
    [NotificationType.PAYMENT_RECEIVED]:
      "✅ Payment of {{amount}} {{currency}} received by {{groupName}}. Ref: {{reference}}",
    [NotificationType.PAYMENT_FAILED]:
      "❌ Payment of {{amount}} {{currency}} failed. Reason: {{reason}}. Please retry.",
    [NotificationType.PAYOUT_AVAILABLE]:
      "💸 {{amount}} {{currency}} payout is ready from {{groupName}} on {{payoutDate}}",
    [NotificationType.PAYOUT_SCHEDULED]:
      "📅 Payout of {{amount}} {{currency}} scheduled for {{payoutDate}}",
    [NotificationType.DISPUTE_OPENED]:
      "⚖️ New dispute in {{groupName}}: {{disputeTitle}}. Vote by {{votingDeadline}}",
    [NotificationType.DISPUTE_RESOLUTION_VOTE]:
      "🗳️ Vote needed on dispute in {{groupName}}: {{disputeTitle}}",
    [NotificationType.DISPUTE_RESOLVED]:
      "✅ Dispute in {{groupName}} resolved: {{resolution}}",
    [NotificationType.GROUP_INVITATION]:
      "👋 You're invited to join {{groupName}}. Accept: {{acceptUrl}}",
    [NotificationType.MEMBER_JOINED]:
      "👤 {{userName}} joined {{groupName}}",
    [NotificationType.CUSTOM]: "{{message}}",
  };

  /**
   * Default email templates
   */
  private defaultEmailTemplates: Record<NotificationType, string> = {
    [NotificationType.CONTRIBUTION_DUE]: `
      <h2>Contribution Due</h2>
      <p>Hi {{userName}},</p>
      <p>Your contribution of <strong>{{amount}} {{currency}}</strong> to <strong>{{groupName}}</strong> is due on <strong>{{dueDate}}</strong>.</p>
      <p>Please make your payment on time to avoid penalties.</p>
      <p>Best regards,<br>Mbole Pay Team</p>
    `,
    [NotificationType.CONTRIBUTION_OVERDUE]: `
      <h2>⚠️ Contribution Overdue</h2>
      <p>Hi {{userName}},</p>
      <p>Your contribution of <strong>{{amount}} {{currency}}</strong> to <strong>{{groupName}}</strong> is <strong>{{overdueBy}}</strong> overdue.</p>
      <p>Please settle this immediately to avoid further consequences.</p>
      <p>Best regards,<br>Mbole Pay Team</p>
    `,
    [NotificationType.PAYMENT_RECEIVED]: `
      <h2>✅ Payment Received</h2>
      <p>Hi {{userName}},</p>
      <p>We've received your payment of <strong>{{amount}} {{currency}}</strong> for {{groupName}}.</p>
      <p><strong>Reference:</strong> {{reference}}</p>
      <p>Thank you!</p>
    `,
    [NotificationType.PAYMENT_FAILED]: `
      <h2>❌ Payment Failed</h2>
      <p>Hi {{userName}},</p>
      <p>Your payment of <strong>{{amount}} {{currency}}</strong> could not be processed.</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p>Please retry or contact support.</p>
    `,
    [NotificationType.PAYOUT_AVAILABLE]: `
      <h2>💸 Payout Available</h2>
      <p>Hi {{userName}},</p>
      <p>Your payout of <strong>{{amount}} {{currency}}</strong> from <strong>{{groupName}}</strong> is ready and will be sent on {{payoutDate}}.</p>
      <p>Thank you for your participation!</p>
    `,
    [NotificationType.PAYOUT_SCHEDULED]: `
      <h2>📅 Payout Scheduled</h2>
      <p>Hi {{userName}},</p>
      <p>Your payout of <strong>{{amount}} {{currency}}</strong> has been scheduled for <strong>{{payoutDate}}</strong>.</p>
    `,
    [NotificationType.DISPUTE_OPENED]: `
      <h2>⚖️ Dispute Opened</h2>
      <p>Hi {{userName}},</p>
      <p>A new dispute has been opened in {{groupName}}: <strong>{{disputeTitle}}</strong></p>
      <p>Your vote is needed by {{votingDeadline}}. Please log in to vote.</p>
    `,
    [NotificationType.DISPUTE_RESOLUTION_VOTE]: `
      <h2>🗳️ Dispute Needs Your Vote</h2>
      <p>Hi {{userName}},</p>
      <p>A dispute in {{groupName}} needs your vote: <strong>{{disputeTitle}}</strong></p>
      <p>Please log in to cast your vote.</p>
    `,
    [NotificationType.DISPUTE_RESOLVED]: `
      <h2>✅ Dispute Resolved</h2>
      <p>Hi {{userName}},</p>
      <p>The dispute in {{groupName}} (<strong>{{disputeTitle}}</strong>) has been resolved.</p>
      <p><strong>Resolution:</strong> {{resolution}}</p>
    `,
    [NotificationType.GROUP_INVITATION]: `
      <h2>👋 You're Invited!</h2>
      <p>Hi {{userName}},</p>
      <p>You've been invited to join <strong>{{groupName}}</strong>.</p>
      <p><a href="{{acceptUrl}}">Accept Invitation</a></p>
    `,
    [NotificationType.MEMBER_JOINED]: `
      <h2>👤 New Member</h2>
      <p>{{userName}} just joined {{groupName}}!</p>
    `,
    [NotificationType.CUSTOM]: `<p>{{message}}</p>`,
  };

  /**
   * Initialize templates (can be overridden with DB templates later)
   */
  private initializeTemplates(): void {
    // Templates can be loaded from database here
    // For now, using default templates
  }

  /**
   * Register custom template
   */
  registerTemplate(
    type: NotificationType,
    channel: "email" | "sms",
    template: string
  ): void {
    if (!this.templates.has(type)) {
      this.templates.set(type, {});
    }
    this.templates.get(type)![channel] = template;
  }

  /**
   * Verify all services are configured correctly
   */
  async verifyServices(): Promise<{
    email: boolean;
    sms: boolean;
  }> {
    const [emailOk, smsOk] = await Promise.all([
      this.emailService.verifyCredentials(),
      this.smsService.verifyCredentials(),
    ]);

    return { email: emailOk, sms: smsOk };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    email: {
      operational: boolean;
      quota?: { used: number; limit: number };
    };
    sms: {
      operational: boolean;
      quota?: { used: number; limit: number };
    };
  }> {
    const [emailOk, smsOk] = await Promise.all([
      this.emailService.verifyCredentials(),
      this.smsService.verifyCredentials(),
    ]);

    const emailQuota = emailOk
      ? await this.emailService.getQuota?.()
      : undefined;
    const smsQuota = smsOk ? await this.smsService.getQuota?.() : undefined;

    return {
      email: { operational: emailOk, quota: emailQuota },
      sms: { operational: smsOk, quota: smsQuota },
    };
  }
}

// Singleton instance
let notificationFactory: NotificationFactory | null = null;

/**
 * Get or create notification factory
 */
export function getNotificationFactory(): NotificationFactory {
  if (!notificationFactory) {
    notificationFactory = new NotificationFactory();
  }
  return notificationFactory;
}

// Default export
export default NotificationFactory;
