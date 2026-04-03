"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { usePayment } from "@/hooks/use-payment";
import { PaymentStatusResponse } from "@/types/payments";
import { Check, Clock, X, AlertCircle } from "lucide-react";

interface PaymentStatusDisplayProps {
  paymentId: string;
  autoPolling?: boolean;
  onCompleted?: () => void;
  onFailed?: () => void;
}

export function PaymentStatusDisplay({
  paymentId,
  autoPolling = true,
  onCompleted,
  onFailed,
}: PaymentStatusDisplayProps) {
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { getPaymentStatus, pollPaymentStatus, stopPolling, retryPayment } = usePayment();

  useEffect(() => {
    // Initial fetch
    const fetchStatus = async () => {
      const result = await getPaymentStatus(paymentId);
      setStatus(result);
      setLoading(false);

      if (result?.status === "COMPLETED") {
        onCompleted?.();
      } else if (result?.status === "FAILED") {
        onFailed?.();
      }
    };

    fetchStatus();

    // Setup polling if enabled
    if (autoPolling) {
      const cleanup = pollPaymentStatus(paymentId, (updatedStatus) => {
        setStatus(updatedStatus);

        if (updatedStatus.status === "COMPLETED") {
          onCompleted?.();
        } else if (updatedStatus.status === "FAILED") {
          onFailed?.();
        }
      });

      return cleanup;
    }

    return () => {
      stopPolling();
    };
  }, [paymentId, autoPolling, getPaymentStatus, pollPaymentStatus, stopPolling, onCompleted, onFailed]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          icon: <Clock className="w-5 h-5 text-blue-500" />,
          label: "Pending",
          description: "Waiting for payment confirmation",
          variant: "outline" as const,
        };
      case "PROCESSING":
        return {
          icon: <Clock className="w-5 h-5 text-amber-500 animate-spin" />,
          label: "Processing",
          description: "Your payment is being processed",
          variant: "default" as const,
        };
      case "COMPLETED":
        return {
          icon: <Check className="w-5 h-5 text-green-500" />,
          label: "Completed",
          description: "Payment successful",
          variant: "default" as const,
        };
      case "FAILED":
        return {
          icon: <X className="w-5 h-5 text-red-500" />,
          label: "Failed",
          description: "Payment could not be processed",
          variant: "destructive" as const,
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
          label: "Unknown",
          description: "Unknown payment status",
          variant: "outline" as const,
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>Failed to load payment status</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(status.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
        <CardDescription>Transaction reference: {status.paymentId.slice(0, 8)}...</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Badge and Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div>
              <h3 className="font-semibold">{statusInfo.label}</h3>
              <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
            </div>
          </div>

          <Badge variant={statusInfo.variant} className="w-fit">
            {statusInfo.label}
          </Badge>
        </div>

        {/* Payment Details */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">
              {status.amount.toLocaleString()} {status.currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone Number</span>
            <span className="font-mono text-xs">{status.phoneNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Provider</span>
            <span className="font-semibold">
              {status.provider === "MTN_MOMO" ? "MTN MoMo" : "Orange Money"}
            </span>
          </div>
          {status.providerRef && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider Reference</span>
              <span className="font-mono text-xs">{status.providerRef.slice(0, 12)}...</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="text-xs">{new Date(status.updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Error Message */}
        {status.errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{status.errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Status-Specific Messages */}
        {status.status === "PENDING" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Waiting for your confirmation. Check your phone for the payment prompt.
            </AlertDescription>
          </Alert>
        )}

        {status.status === "PROCESSING" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your payment is being processed. This usually takes a few seconds. Please don't close this
              page.
            </AlertDescription>
          </Alert>
        )}

        {status.status === "COMPLETED" && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Your payment has been successfully completed. Your contribution is now marked as paid.
            </AlertDescription>
          </Alert>
        )}

        {status.status === "FAILED" && (
          <div className="space-y-3">
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>
                Your payment failed. Please try again with a different payment method or contact support.
              </AlertDescription>
            </Alert>

            <Button
              className="w-full"
              onClick={async () => {
                await retryPayment(paymentId);
              }}
            >
              Retry Payment
            </Button>
          </div>
        )}

        {/* Auto-refresh Info */}
        {status.status === "PENDING" || status.status === "PROCESSING" ? (
          <p className="text-xs text-muted-foreground text-center">
            Status updates every 3 seconds automatically
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
