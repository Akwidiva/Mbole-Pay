import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ApiResponse } from "@/types/payments";

export interface CalendarEvent {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  dueDate: string; // ISO date string
  status: string;
  paidAt: string | null;
  isOverdue: boolean;
  paymentId?: string;
  paymentStatus?: string;
  paymentProvider?: string;
}

export interface CalendarStats {
  totalContributions: number;
  paidContributions: number;
  pendingContributions: number;
  overdueContributions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

export interface CalendarData {
  group: {
    id: string;
    name: string;
    frequency: string;
    cycleType: string;
    contributionAmount: number;
  };
  contributions: CalendarEvent[];
  eventsByDate: Record<string, CalendarEvent[]>;
  stats: CalendarStats;
  period: {
    month?: string;
    year?: string;
  };
}

export function useContributionCalendar(groupId: string, month?: string, year?: string) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ groupId });
      if (month) params.append("month", month);
      if (year) params.append("year", year);

      const response = await fetch(`/api/contributions/calendar?${params.toString()}`);
      const result: ApiResponse<CalendarData> = await response.json();

      if (!result.success) {
        const errorMsg = result.error?.message || "Failed to load calendar";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      setData(result.data!);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to load calendar";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchCalendar();
    }
  }, [groupId, month, year]);

  return { data, loading, error, refetch: fetchCalendar };
}
