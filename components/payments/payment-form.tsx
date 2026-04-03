"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PaymentProvider } from "@/types/payments";
import { usePayment } from "@/hooks/use-payment";
import { PaymentProviderSelector } from "./payment-provider-selector";

const paymentFormSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+237|\+221)?[679]\d{8}$/,
      "Invalid phone number. Use +237XXXXXXXXX or local format"
    ),
  provider: z.enum(["MTN_MOMO", "ORANGE_MONEY"]),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  groupId: string;
  contributionId: string;
  amount: number;
  currency: string;
  groupName: string;
  onPaymentInitialized?: (paymentId: string) => void;
}

export function PaymentForm({
  groupId,
  contributionId,
  amount,
  currency,
  groupName,
  onPaymentInitialized,
}: PaymentFormProps) {
  const [showProviderSelector, setShowProviderSelector] = useState(true);
  const { loading, error, initializePayment } = usePayment({
    onSuccess: (data) => {
      onPaymentInitialized?.(data.paymentId);
    },
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      phoneNumber: "",
      provider: undefined,
    },
  });

  async function onSubmit(values: PaymentFormValues) {
    const result = await initializePayment(
      groupId,
      contributionId,
      values.phoneNumber,
      values.provider as PaymentProvider
    );

    if (result) {
      form.reset();
    }
  }

  const selectedProvider = form.watch("provider");

  const getPhonePlaceholder = (provider?: PaymentProvider) => {
    if (provider === "MTN_MOMO") {
      return "691234567 or +237691234567";
    }
    if (provider === "ORANGE_MONEY") {
      return "690123456 or +237690123456";
    }
    return "Enter phone number";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make Payment</CardTitle>
        <CardDescription>
          Pay your contribution for <strong>{groupName}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Amount</span>
              <span className="text-lg font-bold">
                {amount.toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Group</span>
              <span className="text-sm font-medium">{groupName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Reference</span>
              <span className="text-xs font-mono text-muted-foreground">
                {contributionId.slice(0, 8)}...
              </span>
            </div>
          </div>

          {/* Provider Selection */}
          {showProviderSelector ? (
            <div>
              <PaymentProviderSelector
                selectedProvider={selectedProvider as PaymentProvider}
                onSelect={(provider) => {
                  form.setValue("provider", provider);
                  setShowProviderSelector(false);
                }}
              />
            </div>
          ) : (
            <div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowProviderSelector(true)}
              >
                Change Payment Method: {selectedProvider === "MTN_MOMO" ? "MTN MoMo" : "Orange Money"}
              </Button>
            </div>
          )}

          {/* Payment Form */}
          {selectedProvider && !showProviderSelector && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={getPhonePlaceholder(selectedProvider as PaymentProvider)}
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {selectedProvider === "MTN_MOMO"
                          ? "Cameroon number starting with 6, 7, or 9"
                          : "Orange Money customer number"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-3 text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    ℹ️ What happens next?
                  </p>
                  <p className="text-amber-800 dark:text-amber-200 text-xs">
                    {selectedProvider === "MTN_MOMO"
                      ? "You'll receive a USSD prompt on your phone. Select 'Yes' to confirm and enter your MTN MoMo PIN to complete the payment."
                      : "You'll be redirected to Orange Money checkout. Complete the payment on the secured page and return here to confirm."}
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading} size="lg">
                  {loading ? "Processing..." : `Pay ${amount} ${currency}`}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    form.reset();
                    setShowProviderSelector(true);
                  }}
                  disabled={loading}
                >
                  Back to Payment Methods
                </Button>
              </form>
            </Form>
          )}

          {/* Info Box */}
          {!selectedProvider && !showProviderSelector && (
            <Alert>
              <AlertDescription>
                Please select a payment method above to continue
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
