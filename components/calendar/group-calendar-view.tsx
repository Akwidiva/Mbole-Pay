"use client";

import { useState } from "react";
import { ContributionCalendar } from "./contribution-calendar";
import { ContributionDetailModal } from "./contribution-detail-modal";
import { CalendarEvent } from "@/hooks/use-contribution-calendar";

interface GroupCalendarViewProps {
  groupId: string;
  groupName: string;
  onPaymentSuccess?: () => void;
}

export function GroupCalendarView({
  groupId,
  groupName,
  onPaymentSuccess,
}: GroupCalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  return (
    <>
      <ContributionCalendar groupId={groupId} onEventClick={handleEventClick} />

      <ContributionDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        event={selectedEvent}
        groupId={groupId}
        groupName={groupName}
        onPaymentSuccess={onPaymentSuccess}
      />
    </>
  );
}
