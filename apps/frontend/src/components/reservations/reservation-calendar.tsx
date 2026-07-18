'use client';

import { useCallback, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import type { ReservationSummary, ReservationStatus, CalendarViewType } from '@/lib/reservation-types';
import { RESERVATION_STATUS_LABELS } from '@/lib/reservation-types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';

const STATUS_EVENT_COLORS: Record<ReservationStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  checked_in: '#8b5cf6',
  seated: '#06b6d4',
  completed: '#22c55e',
  cancelled: '#6b7280',
  no_show: '#ef4444',
};

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    status: ReservationStatus;
    partySize: number;
    source: string;
    reservationNumber: string;
  };
}

interface ReservationCalendarProps {
  reservations: ReservationSummary[];
  loading?: boolean;
  error?: string | null;
  view: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onDateChange: (start: string, end: string) => void;
  onEventClick: (reservationId: string) => void;
  onDateSelect?: (start: string, end: string) => void;
  className?: string;
}

const VIEW_INITIAL: Record<CalendarViewType, string> = {
  day: 'timeGridDay',
  week: 'timeGridWeek',
  month: 'dayGridMonth',
  timeline: 'timeGridDay',
  agenda: 'listWeek',
};

export function ReservationCalendar({
  reservations,
  loading = false,
  error = null,
  view,
  onViewChange,
  onDateChange,
  onEventClick,
  onDateSelect,
  className,
}: ReservationCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const events: CalendarEvent[] = useMemo(
    () =>
      reservations.map((r) => ({
        id: r.id,
        title: `${r.reservationNumber} (${r.partySize})`,
        start: r.startTime,
        end: r.endTime,
        backgroundColor: STATUS_EVENT_COLORS[r.status] ?? '#6b7280',
        borderColor: STATUS_EVENT_COLORS[r.status] ?? '#6b7280',
        textColor: '#ffffff',
        extendedProps: {
          status: r.status,
          partySize: r.partySize,
          source: r.source,
          reservationNumber: r.reservationNumber,
        },
      })),
    [reservations],
  );

  const handleViewChange = useCallback(
    (newView: CalendarViewType) => {
      onViewChange(newView);
    },
    [onViewChange],
  );

  const handleDatesChange = useCallback(
    (arg: { start: Date; end: Date }) => {
      onDateChange(arg.start.toISOString(), arg.end.toISOString());
    },
    [onDateChange],
  );

  const handleEventClick = useCallback(
    (arg: EventClickArg) => {
      onEventClick(arg.event.id);
    },
    [onEventClick],
  );

  const handleDateSelect = useCallback(
    (arg: DateSelectArg) => {
      if (onDateSelect) {
        onDateSelect(arg.startStr, arg.endStr);
      }
    },
    [onDateSelect],
  );

  const handleNavToday = useCallback(() => {
    calendarRef.current?.getApi().today();
  }, []);

  const handleNavPrev = useCallback(() => {
    calendarRef.current?.getApi().prev();
  }, []);

  const handleNavNext = useCallback(() => {
    calendarRef.current?.getApi().next();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" role="alert">
        <p className="text-sm text-destructive font-medium">{t('Error loading calendar')}</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNavToday}>
            {t('Today')}
          </Button>
          <Button variant="outline" size="icon-sm" onClick={handleNavPrev} aria-label={t('Previous')}>
            &lt;
          </Button>
          <Button variant="outline" size="icon-sm" onClick={handleNavNext} aria-label={t('Next')}>
            &gt;
          </Button>
        </div>
        <div className="flex items-center gap-1" role="tablist" aria-label={t('Calendar view')}>
          {(['day', 'week', 'month', 'timeline', 'agenda'] as CalendarViewType[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleViewChange(v)}
              role="tab"
              aria-selected={view === v}
              aria-label={t('{view} view', { view: v })}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden" aria-label={t('Reservation calendar')}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={VIEW_INITIAL[view]}
          headerToolbar={false}
          events={events}
          eventClick={handleEventClick}
          selectable={false}
          select={handleDateSelect}
          datesSet={handleDatesChange}
          height="auto"
          contentHeight={600}
          slotMinTime="08:00:00"
          slotMaxTime="23:00:00"
          allDaySlot={false}
          nowIndicator
          editable={false}
          dayMaxEvents={3}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap" aria-label={t('Status legend')}>
        {(Object.entries(RESERVATION_STATUS_LABELS) as [ReservationStatus, string][]).map(
          ([status, label]) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_EVENT_COLORS[status] }}
                aria-hidden="true"
              />
              {label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
