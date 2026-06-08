import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { IPaymentProvider } from "./payment-factory";

/**
 * Minimal Fapshi integration client.
 *
 * Environment variables:
 * - FAPSHI_BASE_URL
 * - FAPSHI_API_KEY
 */
export class FapshiService implements IPaymentProvider {
  private baseUrl = process.env.FAPSHI_BASE_URL || "https://sandbox.fapshi.com";
  private apiKey = process.env.FAPSHI_API_KEY || "";

  private authHeaders() {
    return {
      apikey: this.apiKey,
      apiuser: this.apiKey,
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
      if (!this.apiKey) throw new Error("Missing Fapshi API key (FAPSHI_API_KEY)");

      const payload = {
        amount: data.amount,
        phone: data.phoneNumber,
        externalId: data.externalId,
        message: data.description,
      };

      const res = await axios.post(`${this.baseUrl}/direct-pay`, payload, {
        headers: this.authHeaders(),
        timeout: 10000,
      });

      return {
        referenceId,
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
      if (!this.apiKey) throw new Error("Missing Fapshi API key (FAPSHI_API_KEY)");

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
      if (!this.apiKey) throw new Error("Missing Fapshi API key (FAPSHI_API_KEY)");

      const payload = {
        amount: data.amount,
        phone: data.phoneNumber,
        externalId: data.externalId,
        message: data.description,
      };

      const res = await axios.post(`${this.baseUrl}/payout`, payload, {
        headers: this.authHeaders(),
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
    try {
      if (!this.apiKey) return false;

      // Ping base URL with auth headers to validate credentials
      await axios.get(`${this.baseUrl}/`, {
        headers: this.authHeaders(),
        timeout: 5000,
      });

      return true;
    } catch (error) {
      console.error("Fapshi credentials validation failed:", error?.response?.data || error?.message || error);
      return false;
    }
  }
}

export default FapshiService;
