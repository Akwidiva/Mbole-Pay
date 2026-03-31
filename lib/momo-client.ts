// lib/momo-client.ts
import axios from "axios";
import { generateSignature, logPaymentEvent, retryAsync } from "./payment-utils";
import type { PaymentInitRequest, PaymentInitResponse } from "@/types/payment";

export class MTNMoMoClient {
  private serviceId: string;
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;
  private callbackUrl: string;

  constructor() {
    this.serviceId =
      process.env.MTN_MOMO_SERVICE_ID || "MISSING_SERVICE_ID";
    this.apiKey = process.env.MTN_MOMO_API_KEY || "MISSING_API_KEY";
    this.secretKey = process.env.MTN_MOMO_SECRET_KEY || "MISSING_SECRET_KEY";
    this.baseUrl =
      process.env.MTN_MOMO_BASE_URL ||
      "https://api.sandbox.momoapi.mtn.com";
    this.callbackUrl =
      process.env.MTN_MOMO_CALLBACK_URL ||
      "http://localhost:3000/api/payments/momo/callback";

    if (
      !this.serviceId ||
      this.serviceId.includes("MISSING")
    ) {
      console.warn("⚠️ MTN MoMo credentials not fully configured");
    }
  }

  /**
   * Initiate a payment request
   */
  async initiatePayment(
    request: PaymentInitRequest
  ): Promise<PaymentInitResponse> {
    const transactionId = `TRX-${Date.now()}-${request.contributionId.slice(0, 8)}`;

    logPaymentEvent("mtn-momo", "PAYMENT_INITIATED", {
      transactionId,
      phoneNumber: request.phoneNumber,
      amount: request.amount,
    });

    try {
      const response = await retryAsync(async () => {
        return await axios.post(
          `${this.baseUrl}/collection/v1_0/requesttopay`,
          {
            amount: request.amount,
            currency: request.currency,
            externalId: request.contributionId,
            payer: {
              partyIdType: "MSISDN",
              partyId: request.phoneNumber,
            },
            payerMessage: "Mbole Pay - Contribution Payment",
            payeeNote: `Group ID: ${request.groupId}`,
          },
          {
            headers: this.getHeaders(transactionId),
            timeout: 10000,
          }
        );
      });

      const externalId = response.headers["x-reference-id"] || transactionId;

      logPaymentEvent("mtn-momo", "PAYMENT_REQUEST_SENT", {
        transactionId,
        externalId,
        statusCode: response.status,
      });

      return {
        transactionId,
        externalId,
        provider: "mtn-momo",
        status: "PENDING",
        amount: request.amount,
        phoneNumber: request.phoneNumber,
        timestamp: new Date(),
        message: "Payment request sent. User will receive prompt on phone.",
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message;
      logPaymentEvent("mtn-momo", "PAYMENT_INIT_ERROR", {
        transactionId,
        error: errorMessage,
      });

      throw new Error(`MTN MoMo payment initiation failed: ${errorMessage}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/collection/v1_0/requesttopay/${transactionId}`,
        {
          headers: this.getHeaders(transactionId),
          timeout: 10000,
        }
      );

      const status = response.data.status;
      logPaymentEvent("mtn-momo", "STATUS_CHECKED", {
        transactionId,
        status,
      });

      return status;
    } catch (error: any) {
      logPaymentEvent("mtn-momo", "STATUS_CHECK_ERROR", {
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
      // Verify webhook signature if provided
      if (webhookData.signature) {
        const payload = JSON.stringify({
          transactionId,
          amount: webhookData.amount,
          status: webhookData.status,
        });

        const expectedSignature = generateSignature(payload, this.secretKey);
        if (expectedSignature !== webhookData.signature) {
          throw new Error("Invalid webhook signature");
        }
      }

      // Optionally make API call to confirm
      if (webhookData.status === "SUCCESSFUL") {
        logPaymentEvent("mtn-momo", "PAYMENT_VERIFIED", {
          transactionId,
          status: "SUCCESSFUL",
        });
        return true;
      }

      return false;
    } catch (error: any) {
      logPaymentEvent("mtn-momo", "PAYMENT_VERIFICATION_ERROR", {
        transactionId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate request headers with authentication
   */
  private getHeaders(requestId: string) {
    const timestamp = new Date().toISOString();
    const signature = generateSignature(
      `${this.apiKey}${requestId}${timestamp}`,
      this.secretKey
    );

    return {
      "X-Reference-Id": requestId,
      "X-Target-Environment": "sandbox", // Change to 'production' for live
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": this.apiKey,
      Authorization: `Bearer ${signature}`,
    };
  }

  /**
   * Check if credentials are configured
   */
  isConfigured(): boolean {
    return (
      !this.serviceId.includes("MISSING") &&
      !this.apiKey.includes("MISSING") &&
      !this.secretKey.includes("MISSING")
    );
  }
}

// Singleton instance
let momoClient: MTNMoMoClient | null = null;

export function getMTNMoMoClient(): MTNMoMoClient {
  if (!momoClient) {
    momoClient = new MTNMoMoClient();
  }
  return momoClient;
}
