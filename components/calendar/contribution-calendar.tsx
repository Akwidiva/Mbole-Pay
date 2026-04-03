"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContributionCalendar, CalendarEvent } from "@/hooks/use-contribution-calendar";
import { ChevronLeft, ChevronRight, AlertCircle, Check, Clock } from "lucide-react";

interface ContributionCalendarProps {
  groupId: string;
  onEventClick?: (event: CalendarEvent) => void;
}

export function ContributionCalendar({ groupId, onEventClick }: ContributionCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;

  const { data, loading, error } = useContributionCalendar(groupId, monthString);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const getEventStatus = (status: string) => {
    switch (status) {
      case "PAID":
        return { icon: Check, color: "text-green-600", label: "Paid" };
      case "PENDING":
        return { icon: Clock, color: "text-blue-600", label: "Pending" };
      case "OVERDUE":
        return { icon: AlertCircle, color: "text-red-600", label: "Overdue" };
      default:
        return { icon: Clock, color: "text-gray-600", label: status };
    }
  };

  const getEventsForDate = (day: number) => {
    if (!data) return [];
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return data.eventsByDate[dateKey] || [];
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contribution Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contribution Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution Calendar</CardTitle>
        <CardDescription>{data?.group.name}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistics */}
        {data?.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="font-bold text-green-600">
                {data.stats.paidContributions}/{data.stats.totalContributions}
              </p>
              <p className="text-xs text-muted-foreground">
                {(data.stats.paidAmount / 1000).toFixed(0)}k XAF
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3">
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-bold text-blue-600">
                {data.stats.pendingContributions}/{data.stats.totalContributions}
              </p>
              <p className="text-xs text-muted-foreground">
                {(data.stats.pendingAmount / 1000).toFixed(0)}k XAF
              </p>
            </div>

            <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3">
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="font-bold text-red-600">{data.stats.overdueContributions}</p>
              <p className="text-xs text-muted-foreground">
                {(data.stats.overdueAmount / 1000).toFixed(0)}k XAF
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-bold text-purple-600">
                {(data.stats.totalAmount / 1000).toFixed(0)}k XAF
              </p>
              <p className="text-xs text-muted-foreground">
                Avg: {(data.stats.totalAmount / data.stats.totalContributions / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{monthName}</h3>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-bold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty days */}
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-muted/20 rounded-lg" />
            ))}

            {/* Actual days */}
            {days.map((day) => {
              const events = getEventsForDate(day);
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`h-24 rounded-lg border-2 p-2 space-y-1 overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                    isToday ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? "text-primary" : ""}`}>
                      {day}
                    </span>
                    {events.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {events.length}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {events.slice(0, 2).map((event) => {
                      const statusInfo = getEventStatus(event.status);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={event.id}
                          className="text-xs bg-muted rounded px-1.5 py-0.5 flex items-center gap-1 cursor-pointer hover:bg-primary/20 truncate"
                          onClick={() => onEventClick?.(event)}
                        >
                          <StatusIcon className={`w-3 h-3 flex-shrink-0 ${statusInfo.color}`} />
                          <span className="truncate">{event.userName}</span>
                        </div>
                      );
                    })}

                    {events.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600" />
            <span>Paid</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Overdue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
