"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentModal } from "./payment-modal";
import { AlertCircle, Check, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContributionPaymentButtonProps {
  contributionId: string;
  groupId: string;
  groupName: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  onPaymentSuccess?: () => void;
}

export function ContributionPaymentButton({
  contributionId,
  groupId,
  groupName,
  amount,
  currency,
  status,
  onPaymentSuccess,
}: ContributionPaymentButtonProps) {
  const [open, setOpen] = useState(false);

  if (status === "PAID") {
    return (
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4 text-green-600" />
        <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>
      </div>
    );
  }

  const isOverdue = status === "OVERDUE";

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={isOverdue ? "destructive" : "default"}
        size="sm"
        className="gap-2"
      >
        {isOverdue && <AlertCircle className="w-4 h-4" />}
        {isOverdue ? "Pay Now (Overdue)" : "Pay Contribution"}
      </Button>

      <PaymentModal
        open={open}
        onOpenChange={setOpen}
        groupId={groupId}
        contributionId={contributionId}
        amount={amount}
        currency={currency}
        groupName={groupName}
        onPaymentSuccess={() => {
          onPaymentSuccess?.();
          setOpen(false);
        }}
      />
    </>
  );
}
