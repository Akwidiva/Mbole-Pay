"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentForm } from "./payment-form";
import { PaymentStatusDisplay } from "./payment-status-display";
import { PaymentHistoryList } from "./payment-history-list";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  contributionId: string;
  amount: number;
  currency: string;
  groupName: string;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  groupId,
  contributionId,
  amount,
  currency,
  groupName,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [tab, setTab] = useState<"pay" | "status" | "history">("pay");

  const handlePaymentInitialized = (paymentId: string) => {
    setCurrentPaymentId(paymentId);
    setTab("status");
  };

  const handlePaymentCompleted = () => {
    setTimeout(() => {
      onPaymentSuccess?.();
      onOpenChange(false);
      setCurrentPaymentId(null);
      setTab("pay");
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Make Payment</DialogTitle>
          <DialogDescription>
            Pay your contribution for {groupName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(value) => setTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pay">Payment</TabsTrigger>
            <TabsTrigger value="status" disabled={!currentPaymentId}>
              Status
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Payment Tab */}
          <TabsContent value="pay" className="space-y-4">
            <PaymentForm
              groupId={groupId}
              contributionId={contributionId}
              amount={amount}
              currency={currency}
              groupName={groupName}
              onPaymentInitialized={handlePaymentInitialized}
            />
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            {currentPaymentId ? (
              <PaymentStatusDisplay
                paymentId={currentPaymentId}
                autoPolling={true}
                onCompleted={handlePaymentCompleted}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active payment. Start a new payment above.
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <PaymentHistoryList groupId={groupId} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
