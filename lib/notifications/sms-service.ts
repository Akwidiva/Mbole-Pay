/**
 * SMS Service - Twilio Integration
 * Handles sending SMS messages globally
 */

import { SmsOptions, SendSmsResponse, ISmsService } from "@/types/notifications";

export class SmsService implements ISmsService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private provider: "twilio" | "vonage" | "aws-sns";

  constructor(
    accountSid?: string,
    authToken?: string,
    fromNumber: string = process.env.SMS_FROM_NUMBER || "+1234567890",
    provider: "twilio" | "vonage" | "aws-sns" = "twilio"
  ) {
    this.accountSid = accountSid || process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = authToken || process.env.TWILIO_AUTH_TOKEN || "";
    this.fromNumber = fromNumber;
    this.provider = provider;

    if (!this.accountSid || !this.authToken) {
      console.warn("⚠️  SMS service: No credentials configured");
    }
  }

  /**
   * Send a single SMS
   */
  async send(options: SmsOptions): Promise<SendSmsResponse> {
    const timestamp = new Date();

    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(options.phoneNumber)) {
        throw new Error("Invalid phone number format");
      }

      if (this.provider === "twilio") {
        return await this.sendViaTwilio(options, timestamp);
      } else if (this.provider === "vonage") {
        return await this.sendViaVonage(options, timestamp);
      } else if (this.provider === "aws-sns") {
        return await this.sendViaSNS(options, timestamp);
      }

      return {
        success: false,
        error: "Unknown SMS provider",
        timestamp,
      };
    } catch (error) {
      console.error("❌ SMS send error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp,
      };
    }
  }

  /**
   * Send multiple SMS in batch
   */
  async sendBatch(options: SmsOptions[]): Promise<SendSmsResponse[]> {
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
      if (this.provider === "twilio") {
        const auth = Buffer.from(
          `${this.accountSid}:${this.authToken}`
        ).toString("base64");

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          }
        );

        return response.ok;
      }

      return true; // Other providers would validate similarly
    } catch (error) {
      console.error("❌ SMS credentials verification failed:", error);
      return false;
    }
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(
    options: SmsOptions,
    timestamp: Date
  ): Promise<SendSmsResponse> {
    const formData = new URLSearchParams();
    formData.append("From", this.fromNumber);
    formData.append("To", options.phoneNumber);
    formData.append("Body", options.message);

    const auth = Buffer.from(
      `${this.accountSid}:${this.authToken}`
    ).toString("base64");

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio error: ${error.message}`);
    }

    const data = (await response.json()) as { sid?: string };
    const messageId = data.sid || "unknown";

    console.log(
      `✅ SMS sent via Twilio to ${options.phoneNumber} (ID: ${messageId})`
    );

    return {
      success: true,
      messageId,
      timestamp,
    };
  }

  /**
   * Send SMS via Vonage (Nexmo)
   * TODO: Implement when Vonage SDK is added
   */
  private async sendViaVonage(
    options: SmsOptions,
    timestamp: Date
  ): Promise<SendSmsResponse> {
    try {
      throw new Error(
        "Vonage integration not yet implemented. Configure TWILIO credentials instead."
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Vonage not implemented",
        timestamp,
      };
    }
  }

  /**
   * Send SMS via AWS SNS
   * TODO: Implement when AWS SDK is added
   */
  private async sendViaSNS(
    options: SmsOptions,
    timestamp: Date
  ): Promise<SendSmsResponse> {
    try {
      throw new Error(
        "AWS SNS integration not yet implemented. Configure TWILIO credentials instead."
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "AWS SNS not implemented",
        timestamp,
      };
    }
  }

  /**
   * Validate phone number format
   * Accepts formats: +1234567890, 1234567890, +1 (234) 567-8900
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove common formatting characters
    const cleaned = phoneNumber.replace(/[\s\-()]/g, "");

    // Check if it's a valid international or local format
    // Should be at least 10 digits for most countries
    const phoneRegex = /^\+?1?\d{9,15}$/;

    return phoneRegex.test(cleaned);
  }

  /**
   * Format phone number to international format
   * Returns +XXXXXXXXXXXX format
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, "");

    // Add + if not present
    if (!cleaned.startsWith("+")) {
      // Assume Cameroon country code (237) if no country code
      return `+237${cleaned.replace(/^237/, "")}`;
    }

    return cleaned;
  }

  /**
   * Get SMS provider quota
   */
  async getQuota(): Promise<{ used: number; limit: number }> {
    try {
      if (this.provider !== "twilio") {
        return { used: 0, limit: 0 };
      }

      // Note: Twilio doesn't provide a direct quota endpoint
      // This would need to aggregate from usage logs
      // For now, returning placeholder
      console.warn("SMS quota tracking not fully implemented for Twilio");

      return { used: 0, limit: 0 };
    } catch (error) {
      console.error("Failed to get SMS quota:", error);
      return { used: 0, limit: 0 };
    }
  }
}

// Default export
export default SmsService;
