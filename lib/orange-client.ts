// lib/orange-client.ts
import axios from "axios";
import { generateSignature, logPaymentEvent, retryAsync } from "./payment-utils";
import type { PaymentInitRequest, PaymentInitResponse } from "@/types/payment";

export class OrangeMoneyClient {
  private merchantId: string;
  private merchantKey: string;
  private merchantSecret: string;
  private baseUrl: string;
  private callbackUrl: string;

  constructor() {
    this.merchantId =
      process.env.ORANGE_MONEY_MERCHANT_ID || "MISSING_MERCHANT_ID";
    this.merchantKey =
      process.env.ORANGE_MONEY_MERCHANT_KEY || "MISSING_MERCHANT_KEY";
    this.merchantSecret =
      process.env.ORANGE_MONEY_MERCHANT_SECRET ||
      "MISSING_MERCHANT_SECRET";
    this.baseUrl =
      process.env.ORANGE_MONEY_BASE_URL ||
      "https://api.sandbox.orangemoney.cm";
    this.callbackUrl =
      process.env.ORANGE_MONEY_CALLBACK_URL ||
      "http://localhost:3000/api/payments/orange/callback";

    if (
      !this.merchantId ||
      this.merchantId.includes("MISSING")
    ) {
      console.warn("⚠️ Orange Money credentials not fully configured");
    }
  }

  /**
   * Initiate a payment request
   */
  async initiatePayment(
    request: PaymentInitRequest
  ): Promise<PaymentInitResponse> {
    const transactionId = `TRX-${Date.now()}-${request.contributionId.slice(0, 8)}`;

    logPaymentEvent("orange-money", "PAYMENT_INITIATED", {
      transactionId,
      phoneNumber: request.phoneNumber,
      amount: request.amount,
    });

    try {
      const payload = {
        merchant_key: this.merchantKey,
        phone: request.phoneNumber,
        amount: request.amount,
        currency: request.currency,
        order_id: request.contributionId,
        is_api: 1,
        return_url: `${this.callbackUrl}?transactionId=${transactionId}`,
        notif_url: this.callbackUrl,
        lang: "en",
        merchant_message: "Mbole Pay - Contribution Payment",
      };

      const response = await retryAsync(async () => {
        return await axios.post(
          `${this.baseUrl}/pay/payment`,
          payload,
          {
            headers: this.getHeaders(payload),
            timeout: 10000,
          }
        );
      });

      const externalId = response.data.id || transactionId;

      logPaymentEvent("orange-money", "PAYMENT_REQUEST_SENT", {
        transactionId,
        externalId,
        statusCode: response.status,
      });

      return {
        transactionId,
        externalId,
        provider: "orange-money",
        status: "PENDING",
        amount: request.amount,
        phoneNumber: request.phoneNumber,
        timestamp: new Date(),
        message: "Payment request sent. User will receive prompt on phone.",
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message;
      logPaymentEvent("orange-money", "PAYMENT_INIT_ERROR", {
        transactionId,
        error: errorMessage,
      });

      throw new Error(`Orange Money payment initiation failed: ${errorMessage}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<string> {
    try {
      const payload = {
        merchant_key: this.merchantKey,
        is_api: 1,
        transaction_id: transactionId,
      };

      const response = await axios.post(
        `${this.baseUrl}/pay/checkpayment`,
        payload,
        {
          headers: this.getHeaders(payload),
          timeout: 10000,
        }
      );

      const status = response.data.status;
      logPaymentEvent("orange-money", "STATUS_CHECKED", {
        transactionId,
        status,
      });

      return status;
    } catch (error: any) {
      logPaymentEvent("orange-money", "STATUS_CHECK_ERROR", {
        transactionId,
        error: error.message,
      });
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }

  /**
   * Verify payment using webhook data
   */
  async verifyPayment(
    transactionId: string,
    webhookData: any
  ): Promise<boolean> {
    try {
      // Verify webhook signature
      const signaturePayload = `${webhookData.amount}${webhookData.status}${transactionId}${this.merchantSecret}`;
      const expectedSignature = generateSignature(
        signaturePayload,
        this.merchantSecret
      );

      if (expectedSignature !== webhookData.signature) {
        logPaymentEvent("orange-money", "PAYMENT_VERIFICATION_FAILED", {
          transactionId,
          reason: "Invalid signature",
        });
        return false;
      }

      if (webhookData.status === "SUCCESS" || webhookData.status === "1") {
        logPaymentEvent("orange-money", "PAYMENT_VERIFIED", {
          transactionId,
          status: "SUCCESS",
        });
        return true;
      }

      return false;
    } catch (error: any) {
      logPaymentEvent("orange-money", "PAYMENT_VERIFICATION_ERROR", {
        transactionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate request headers with merchant authentication
   */
  private getHeaders(payload: any) {
    const signature = this.generateMerchantSignature(payload);

    return {
      "Content-Type": "application/json",
      "Merchant-Id": this.merchantId,
      "Merchant-Key": this.merchantKey,
      "Merchant-Signature": signature,
    };
  }

  /**
   * Generate merchant signature for Orange Money
   */
  private generateMerchantSignature(payload: any): string {
    const signatureString = Object.keys(payload)
      .sort()
      .map((key) => `${key}=${payload[key]}`)
      .join("&");

    return generateSignature(signatureString, this.merchantSecret);
  }

  /**
   * Check if credentials are configured
   */
  isConfigured(): boolean {
    return (
      !this.merchantId.includes("MISSING") &&
      !this.merchantKey.includes("MISSING") &&
      !this.merchantSecret.includes("MISSING")
    );
  }
}

// Singleton instance
let orangeClient: OrangeMoneyClient | null = null;

export function getOrangeMoneyClient(): OrangeMoneyClient {
  if (!orangeClient) {
    orangeClient = new OrangeMoneyClient();
  }
  return orangeClient;
}
