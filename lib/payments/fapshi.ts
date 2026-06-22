import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { IPaymentProvider } from "./payment-factory";

/**
 * Minimal Fapshi integration client.
 *
 * Environment variables:
 * - FAPSHI_BASE_URL
 * - FAPSHI_API_USER
 * - FAPSHI_API_KEY
 */
export class FapshiService implements IPaymentProvider {
  private baseUrl = process.env.FAPSHI_BASE_URL || "https://sandbox.fapshi.com";

  // Collection credentials (initiate-pay / payment-status)
  private apiUser = process.env.FAPSHI_API_USER || "";
  private apiKey = process.env.FAPSHI_API_KEY || "";

  // Payout credentials — Fapshi issues a separate API user/key for disbursement
  private payoutApiUser = process.env.FAPSHI_PAYOUT_API_USER || "";
  private payoutApiKey = process.env.FAPSHI_PAYOUT_API_KEY || "";

  private hasCredentials() {
    return Boolean(this.apiUser && this.apiKey);
  }

  private hasPayoutCredentials() {
    return Boolean(this.payoutApiUser && this.payoutApiKey);
  }

  // Fapshi expects 9-digit local format (e.g. "682019181"), not "+237682019181"
  private toLocalPhone(phone: string): string {
    return phone.replace(/^\+237/, "").replace(/^237/, "").replace(/\s/g, "")
  }

  private authHeaders() {
    return {
      apiuser: this.apiUser,
      apikey: this.apiKey,
      "Content-Type": "application/json",
    };
  }

  private payoutAuthHeaders() {
    return {
      apiuser: this.payoutApiUser,
      apikey: this.payoutApiKey,
      "Content-Type": "application/json",
    };
  }

  async requestToPay(data: {
    amount: number;
    phoneNumber: string;
    externalId: string;
    description: string;
  }) {
    const referenceId = uuidv4();

    try {
      if (!this.hasCredentials()) throw new Error("Missing Fapshi credentials (FAPSHI_API_USER / FAPSHI_API_KEY)");

      const payload = {
        amount: data.amount,
        phone: this.toLocalPhone(data.phoneNumber),
        externalId: data.externalId,
        message: data.description,
      };

      const res = await axios.post(`${this.baseUrl}/initiate-pay`, payload, {
        headers: this.authHeaders(),
        timeout: 10000,
      });

      return {
        referenceId,
        transactionId: res.data?.transId || res.data?.transactionId || res.data?.id,
        checkoutLink: null, // Direct Pay pushes USSD to phone — no web redirect
        status: res.data?.status || "INITIATED",
        message: res.data?.message || "Payment request sent",
        data: res.data,
      };
    } catch (error: any) {
      console.error("Fapshi requestToPay error:", error?.response?.data || error?.message || error);
      throw new Error(`Fapshi error: ${error?.response?.data?.message || error?.message}`);
    }
  }

  async getTransactionStatus(referenceId: string) {
    try {
      if (!this.hasCredentials()) throw new Error("Missing Fapshi credentials (FAPSHI_API_USER / FAPSHI_API_KEY)");

      const res = await axios.get(`${this.baseUrl}/payment-status/${referenceId}`, {
        headers: this.authHeaders(),
        timeout: 8000,
      });

      return {
        referenceId,
        status: res.data?.status,
        amount: res.data?.amount,
        providerRef: res.data?.id || res.data?.transaction_id,
        data: res.data,
      };
    } catch (error: any) {
      console.error("Fapshi status check error:", error?.response?.data || error?.message || error);
      throw new Error(`Fapshi status check failed: ${error?.message}`);
    }
  }

  async transfer(data: {
    amount: number;
    phoneNumber: string;
    externalId: string;
    description: string;
  }) {
    const referenceId = uuidv4();

    try {
      if (!this.hasPayoutCredentials()) {
        throw new Error(
          "Missing Fapshi payout credentials (FAPSHI_PAYOUT_API_USER / FAPSHI_PAYOUT_API_KEY). " +
          "Fapshi issues separate credentials for disbursement — add them to your environment."
        );
      }

      const payload = {
        amount: data.amount,
        phone: this.toLocalPhone(data.phoneNumber),
        externalId: data.externalId,
        message: data.description,
      };

      const res = await axios.post(`${this.baseUrl}/payout`, payload, {
        headers: this.payoutAuthHeaders(),
        timeout: 10000,
      });

      return {
        referenceId,
        status: res.data?.status || "TRANSFER_INITIATED",
        message: res.data?.message || "Transfer initiated",
        data: res.data,
      };
    } catch (error: any) {
      console.error("Fapshi transfer error:", error?.response?.data || error?.message || error);
      throw new Error(`Fapshi transfer failed: ${error?.response?.data?.message || error?.message}`);
    }
  }

  async validateCredentials(): Promise<boolean> {
    // Just verify collection env vars are present — don't ping the live API on startup.
    // Payout credentials (FAPSHI_PAYOUT_API_USER / FAPSHI_PAYOUT_API_KEY) are checked
    // separately inside transfer() so a missing payout key doesn't block collection.
    return this.hasCredentials();
  }

  /** Returns true if payout credentials are configured. */
  hasPayoutConfigured(): boolean {
    return this.hasPayoutCredentials();
  }
}

export default FapshiService;
