"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarEvent } from "@/hooks/use-contribution-calendar";
import { ContributionPaymentButton } from "@/components/payments/contribution-payment-button";
import { Check, Clock, AlertCircle, Calendar, User, DollarSign } from "lucide-react";

interface ContributionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  groupId: string;
  groupName: string;
  onPaymentSuccess?: () => void;
}

export function ContributionDetailModal({
  open,
  onOpenChange,
  event,
  groupId,
  groupName,
  onPaymentSuccess,
}: ContributionDetailModalProps) {
  if (!event) return null;

  const getStatusInfo = (status: string, isOverdue: boolean) => {
    if (isOverdue && status !== "PAID") {
      return {
        label: "OVERDUE",
        icon: AlertCircle,
        variant: "destructive" as const,
        color: "text-red-600",
        description: "This contribution is past its due date",
      };
    }

    switch (status) {
      case "PAID":
        return {
          label: "PAID",
          icon: Check,
          variant: "default" as const,
          color: "text-green-600",
          description: "Payment completed successfully",
        };
      case "PENDING":
        return {
          label: "PENDING",
          icon: Clock,
          variant: "default" as const,
          color: "text-blue-600",
          description: "Waiting for payment",
        };
      default:
        return {
          label: status,
          icon: Clock,
          variant: "default" as const,
          color: "text-gray-600",
          description: "Unknown status",
        };
    }
  };

  const statusInfo = getStatusInfo(event.status, event.isOverdue);
  const StatusIcon = statusInfo.icon;
  const dueDate = new Date(event.dueDate);
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = dueDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const daysOverdue =
    event.status !== "PAID" && event.isOverdue
      ? Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
            Contribution Details
          </DialogTitle>
          <DialogDescription>{groupName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Alert */}
          <Alert variant={statusInfo.variant}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{statusInfo.description}</AlertDescription>
          </Alert>

          {/* Overdue Warning */}
          {event.isOverdue && event.status !== "PAID" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This contribution is {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue.
                Please make payment as soon as possible.
              </AlertDescription>
            </Alert>
          )}

          {/* Contributor Info */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{event.userName}</p>
                  <p className="text-xs text-muted-foreground">{event.userEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contribution Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-lg font-bold">{event.amount.toLocaleString()} {event.currency}</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
          </div>

          {/* Due Date */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Due Date</span>
            </div>
            <p className="text-base font-semibold">{formattedDate}</p>
            <p className="text-xs text-muted-foreground">{formattedTime}</p>
          </div>

          {/* Payment Info */}
          {event.paymentStatus && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Payment Details</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium">
                    MTN MoMo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary">{event.paymentStatus}</Badge>
                </div>
                {event.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid At:</span>
                    <span className="font-medium">
                      {new Date(event.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {event.status !== "PAID" ? (
              <ContributionPaymentButton
                contributionId={event.id}
                groupId={groupId}
                groupName={groupName}
                amount={event.amount}
                currency={event.currency}
                status={event.isOverdue ? "OVERDUE" : "PENDING"}
                onPaymentSuccess={() => {
                  onPaymentSuccess?.();
                  onOpenChange(false);
                }}
              />
            ) : (
              <Button disabled className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Already Paid
              </Button>
            )}

            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
