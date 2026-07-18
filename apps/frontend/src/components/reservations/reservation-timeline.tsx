'use client';

import { useMemo } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import type { ReservationSummary, ReservationStatus } from '@/lib/reservation-types';
import { RESERVATION_STATUS_LABELS } from '@/lib/reservation-types';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';

interface ReservationTimelineProps {
  reservations: ReservationSummary[];
  date: string;
  onReservationClick?: (reservationId: string) => void;
  className?: string;
}

const HOUR_HEIGHT = 60;
const MIN_START_HOUR = 8;
const MAX_END_HOUR = 23;
const TOTAL_HOURS = MAX_END_HOUR - MIN_START_HOUR;

function getStatusColor(status: ReservationStatus): string {
  const colors: Record<ReservationStatus, string> = {
    pending: 'bg-warning/20 border-warning text-warning-foreground',
    confirmed: 'bg-info/20 border-info text-info-foreground',
    checked_in: 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300',
    seated: 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300',
    completed: 'bg-success/20 border-success text-success-foreground',
    cancelled: 'bg-muted/20 border-muted text-muted-foreground line-through',
    no_show: 'bg-destructive/20 border-destructive text-destructive-foreground',
  };
  return colors[status] ?? 'bg-muted/20 border-muted text-muted-foreground';
}

export function ReservationTimeline({
  reservations,
  date,
  onReservationClick,
  className,
}: ReservationTimelineProps) {
  const hours = useMemo(
    () =>
      Array.from({ length: TOTAL_HOURS }, (_, i) => i + MIN_START_HOUR),
    [],
  );

  const positionedReservations = useMemo(() => {
    const dayStart = parseISO(`${date}T00:00:00`);
    return reservations.map((reservation) => {
      const startTime = parseISO(reservation.startTime);
      const endTime = parseISO(reservation.endTime);
      const startMinutes = differenceInMinutes(startTime, dayStart);
      const endMinutes = differenceInMinutes(endTime, dayStart);
      const durationMinutes = endMinutes - startMinutes;

      const top = Math.max(0, (startMinutes / 60) * HOUR_HEIGHT);
      const height = Math.max(20, (durationMinutes / 60) * HOUR_HEIGHT);

      return {
        ...reservation,
        top: `${top}px`,
        height: `${height}px`,
        formattedStart: format(startTime, 'h:mm a'),
        formattedEnd: format(endTime, 'h:mm a'),
      };
    });
  }, [reservations, date]);

  const hasAny = reservations.length > 0;

  return (
    <div className={cn('relative', className)}>
      {!hasAny && (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          {t('No reservations for this date.')}
        </div>
      )}
      {hasAny && (
        <div className="relative" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
          {/* Hour grid lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border/40 text-xs text-muted-foreground"
              style={{ top: `${(hour - MIN_START_HOUR) * HOUR_HEIGHT}px` }}
            >
              <span className="absolute -top-3 left-1">
                {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
              </span>
            </div>
          ))}

          {/* Current time indicator */}
          <div
            className="absolute left-16 right-2 border-t-2 border-destructive z-10"
            style={{
              top: `${((new Date().getHours() - MIN_START_HOUR) * 60 + new Date().getMinutes()) * (HOUR_HEIGHT / 60)}px`,
              display:
                new Date().getHours() >= MIN_START_HOUR &&
                new Date().getHours() < MAX_END_HOUR
                  ? undefined
                  : 'none',
            }}
            aria-label={t('Current time')}
          />

          {/* Reservation blocks */}
          {positionedReservations.map((reservation) => (
            <button
              key={reservation.id}
              type="button"
              className={cn(
                'absolute left-16 right-2 rounded border-l-4 px-2 py-1 text-left text-xs overflow-hidden transition-colors hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-ring',
                getStatusColor(reservation.status),
              )}
              style={{
                top: reservation.top,
                height: reservation.height,
                minHeight: '24px',
              }}
              onClick={() => onReservationClick?.(reservation.id)}
              aria-label={t('Reservation {number}: {status}, {partySize} guests, {start} - {end}', { number: reservation.reservationNumber, status: RESERVATION_STATUS_LABELS[reservation.status], partySize: reservation.partySize, start: reservation.formattedStart, end: reservation.formattedEnd })}
            >
              <div className="font-medium truncate">
                {reservation.reservationNumber}
              </div>
              <div className="opacity-80 truncate">
                {t('{count} guests', { count: reservation.partySize })}
              </div>
              <div className="opacity-60 truncate">
                {reservation.formattedStart} - {reservation.formattedEnd}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
