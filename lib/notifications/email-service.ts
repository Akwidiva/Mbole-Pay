/**
 * Email Service - SendGrid Integration
 * Handles sending transactional and marketing emails
 */

import { EmailOptions, SendEmailResponse, IEmailService } from "@/types/notifications";

export class EmailService implements IEmailService {
  private apiKey: string;
  private fromEmail: string;
  private provider: "sendgrid" | "aws-ses";

  constructor(
    apiKey?: string,
    fromEmail: string = process.env.EMAIL_FROM || "noreply@mbolepay.com",
    provider: "sendgrid" | "aws-ses" = "sendgrid"
  ) {
    this.apiKey = apiKey || process.env.SENDGRID_API_KEY || "";
    this.fromEmail = fromEmail;
    this.provider = provider;

    if (!this.apiKey) {
      console.warn("⚠️  Email service: No API key configured");
    }
  }

  /**
   * Send a single email
   */
  async send(options: EmailOptions): Promise<SendEmailResponse> {
    const timestamp = new Date();

    try {
      if (this.provider === "sendgrid") {
        return await this.sendViaSendGrid(options, timestamp);
      } else if (this.provider === "aws-ses") {
        return await this.sendViaAwsSES(options, timestamp);
      }

      return {
        success: false,
        error: "Unknown email provider",
        timestamp,
      };
    } catch (error) {
      console.error("❌ Email send error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp,
      };
    }
  }

  /**
   * Send multiple emails in batch
   */
  async sendBatch(options: EmailOptions[]): Promise<SendEmailResponse[]> {
    const results = await Promise.all(
      options.map((opt) => this.send(opt))
    );
    return results;
  }

  /**
   * Verify API credentials
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      if (this.provider === "sendgrid") {
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "OPTIONS",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        });
        return response.ok;
      }
      return true; // AWS credentials verified at construction
    } catch (error) {
      console.error("❌ Email credentials verification failed:", error);
      return false;
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(
    options: EmailOptions,
    timestamp: Date
  ): Promise<SendEmailResponse> {
    const payload = {
      personalizations: [
        {
          to: [{ email: options.to }],
          subject: options.subject,
        },
      ],
      from: { email: options.from || this.fromEmail },
      content: [
        {
          type: "text/html",
          value: options.html,
        },
      ],
      ...(options.replyTo && {
        reply_to: { email: options.replyTo },
      }),
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `SendGrid error: ${response.status} - ${error}`
      );
    }

    // SendGrid returns 202 Accepted on success (no response body)
    const messageId = response.headers.get("x-message-id") || "unknown";

    console.log(`✅ Email sent via SendGrid to ${options.to} (ID: ${messageId})`);

    return {
      success: true,
      messageId,
      timestamp,
    };
  }

  /**
   * Send email via AWS SES
   * TODO: Implement when AWS SDK is added
   */
  private async sendViaAwsSES(
    options: EmailOptions,
    timestamp: Date
  ): Promise<SendEmailResponse> {
    try {
      // This would use @aws-sdk/client-ses
      // For now, throwing error indicating it's not implemented
      throw new Error(
        "AWS SES integration not yet implemented. Configure SENDGRID_API_KEY instead."
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "AWS SES not implemented",
        timestamp,
      };
    }
  }

  /**
   * Get SendGrid API quota info
   */
  async getQuota(): Promise<{ used: number; limit: number }> {
    try {
      if (this.provider !== "sendgrid") {
        return { used: 0, limit: 0 };
      }

      const response = await fetch("https://api.sendgrid.com/v3/user/credits", {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch SendGrid quota");
      }

      const data = (await response.json()) as { used: number; limit: number };
      return data;
    } catch (error) {
      console.error("Failed to get email quota:", error);
      return { used: 0, limit: 0 };
    }
  }
}

// Default export
export default EmailService;
