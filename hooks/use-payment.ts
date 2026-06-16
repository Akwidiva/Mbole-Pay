import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  PaymentStatus,
  PaymentProvider,
  InitializePaymentResponse,
  PaymentStatusResponse,
  ApiResponse,
} from "@/types/payments";

interface UsePaymentOptions {
  onSuccess?: (data: InitializePaymentResponse) => void;
  onError?: (error: string) => void;
  pollInterval?: number; // ms to poll for status updates
}

export function usePayment(options: UsePaymentOptions = {}) {
  const { onSuccess, onError, pollInterval = 3000 } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize a payment request
   */
  const initializePayment = useCallback(
    async (
      groupId: string,
      contributionId: string,
      phoneNumber: string,
      provider: PaymentProvider
    ): Promise<InitializePaymentResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/payments/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId,
            contributionId,
            phoneNumber,
            provider,
          }),
        });

        const data: ApiResponse<InitializePaymentResponse> = await response.json();

        if (!data.success) {
          const errorMsg = data.error?.message || "Failed to initialize payment";
          setError(errorMsg);
          onError?.(errorMsg);
          toast.error(errorMsg);
          return null;
        }

        toast.success(data.data?.message || "Payment initialized");
        onSuccess?.(data.data!);
        return data.data!;
      } catch (err: any) {
        const errorMsg = err.message || "Payment initialization failed";
        setError(errorMsg);
        onError?.(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Get current payment status
   */
  const getPaymentStatus = useCallback(
    async (paymentId: string, refresh: boolean = false): Promise<PaymentStatusResponse | null> => {
      try {
        const url = `/api/payments/${paymentId}${refresh ? "?refresh=true" : ""}`;
        const response = await fetch(url);
        const data: ApiResponse<PaymentStatusResponse> = await response.json();

        if (!data.success) {
          console.error("Failed to get payment status:", data.error);
          return null;
        }

        return data.data!;
      } catch (err: any) {
        console.error("Error fetching payment status:", err);
        return null;
      }
    },
    []
  );

  /**
   * Poll payment status until completion or failure
   */
  const pollPaymentStatus = useCallback(
    (
      paymentId: string,
      onStatusUpdate: (status: PaymentStatusResponse) => void,
      maxDuration: number = 5 * 60 * 1000 // 5 minutes default
    ) => {
      let elapsed = 0;
      const interval = setInterval(async () => {
        elapsed += pollInterval;

        const status = await getPaymentStatus(paymentId, true);
        if (status) {
          onStatusUpdate(status);

          // Stop polling if completed or failed
          if (status.status === "COMPLETED" || status.status === "FAILED") {
            clearInterval(interval);
            pollTimeoutRef.current = null;
            return;
          }
        }

        // Stop polling after max duration
        if (elapsed >= maxDuration) {
          clearInterval(interval);
          pollTimeoutRef.current = null;
        }
      }, pollInterval);

      pollTimeoutRef.current = interval;
      return () => clearInterval(interval);
    },
    [pollInterval, getPaymentStatus]
  );

  /**
   * Retry a failed payment
   */
  const retryPayment = useCallback(
    async (paymentId: string, phoneNumber?: string): Promise<InitializePaymentResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/payments/${paymentId}/retry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber }),
        });

        const data: ApiResponse<InitializePaymentResponse> = await response.json();

        if (!data.success) {
          const errorMsg = data.error?.message || "Failed to retry payment";
          setError(errorMsg);
          onError?.(errorMsg);
          toast.error(errorMsg);
          return null;
        }

        toast.success(data.data?.message || "Payment retry initiated");
        onSuccess?.(data.data!);
        return data.data!;
      } catch (err: any) {
        const errorMsg = err.message || "Payment retry failed";
        setError(errorMsg);
        onError?.(errorMsg);
        toast.error(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Cancel a pending payment
   */
  const cancelPayment = useCallback(async (paymentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (!data.success) {
        toast.error(data.error?.message || "Failed to cancel payment");
        return false;
      }

      toast.success("Payment cancelled");
      return true;
    } catch (err: any) {
      toast.error("Failed to cancel payment");
      return false;
    }
  }, []);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearInterval(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  return {
    loading,
    error,
    initializePayment,
    getPaymentStatus,
    pollPaymentStatus,
    retryPayment,
    cancelPayment,
    stopPolling,
  };
}
