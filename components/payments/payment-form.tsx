"use client";

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

const paymentFormSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+237|\+221)?[679]\d{8}$/,
      "Invalid phone number. Use +237XXXXXXXXX or local format"
    ),
  provider: z.literal(PaymentProvider.MTN_MOMO),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormProps {
  groupId: string;
  contributionId: string;
  amount: number;
  currency: string;
  groupName: string;
  defaultPhoneNumber?: string;
  onPaymentInitialized?: (paymentId: string) => void;
}

export function PaymentForm({
  groupId,
  contributionId,
  amount,
  currency,
  groupName,
  defaultPhoneNumber,
  onPaymentInitialized,
}: PaymentFormProps) {
  const provider = PaymentProvider.MTN_MOMO;
  const { loading, error, initializePayment } = usePayment({
    onSuccess: (data) => {
      onPaymentInitialized?.(data.paymentId);
    },
  });

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      phoneNumber: defaultPhoneNumber || "",
      provider,
    },
  });

  async function onSubmit(values: PaymentFormValues) {
    const result = await initializePayment(
      groupId,
      contributionId,
      values.phoneNumber,
      provider
    );

    if (result) {
      form.reset();
    }
  }

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

          {/* Payment Form */}
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
                        placeholder="691234567 or +237691234567"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      MTN MoMo number starting with 6, 7, or 9
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
                  You'll receive a USSD prompt on your phone. Select 'Yes' to confirm and enter your MTN MoMo PIN to complete the payment.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading} size="lg">
                {loading ? "Processing..." : `Pay ${amount} ${currency}`}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
