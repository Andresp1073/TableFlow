'use client';

import { format } from 'date-fns';
import { Calendar, Clock, Users, Tag, FileText, MessageSquare, User } from 'lucide-react';
import type { ReservationDTO, ReservationStatus } from '@/lib/reservation-types';
import { RESERVATION_SOURCE_OPTIONS } from '@/lib/reservation-types';
import { ReservationStatusBadge } from './reservation-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';

interface ReservationDetailViewProps {
  reservation?: ReservationDTO | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className="text-sm font-medium break-words">{value}</div>
      </div>
    </div>
  );
}

function getSourceLabel(source: string): string {
  return t(RESERVATION_SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? source);
}

export function ReservationDetailView({
  reservation,
  loading = false,
  error = null,
  className,
}: ReservationDetailViewProps) {
  if (error) {
    return (
      <Card className={cn('border-destructive/50', className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center" role="alert">
            <p className="text-sm text-destructive font-medium">{t('Error loading reservation')}</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading || !reservation) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedDate = format(new Date(reservation.date), 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(new Date(reservation.startTime), 'h:mm a');
  const formattedEndTime = format(new Date(reservation.endTime), 'h:mm a');

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          {reservation.reservationNumber}
        </CardTitle>
        <ReservationStatusBadge status={reservation.status as ReservationStatus} size="lg" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label={t('Date')}
            value={formattedDate}
          />
          <DetailRow
            icon={<Clock className="h-4 w-4" />}
            label={t('Time')}
            value={`${formattedStartTime} - ${formattedEndTime}`}
          />
          <DetailRow
            icon={<Users className="h-4 w-4" />}
            label={t('Party size')}
            value={reservation.partySize === 1 ? t('{count} guest', { count: reservation.partySize }) : t('{count} guests', { count: reservation.partySize })}
          />
          <DetailRow
            icon={<Tag className="h-4 w-4" />}
            label={t('Source')}
            value={getSourceLabel(reservation.source)}
          />
          {reservation.tableId && (
            <DetailRow
              icon={<span className="text-xs font-mono">T</span>}
              label={t('Assigned Table')}
              value={reservation.tableId}
            />
          )}
          {reservation.customerId && (
            <DetailRow
              icon={<User className="h-4 w-4" />}
              label={t('Customer ID')}
              value={reservation.customerId}
            />
          )}
          {reservation.specialRequests && (
            <div className="sm:col-span-2">
              <DetailRow
                icon={<MessageSquare className="h-4 w-4" />}
                label={t('Special Requests')}
                value={reservation.specialRequests}
              />
            </div>
          )}
          {reservation.notes && (
            <div className="sm:col-span-2">
              <DetailRow
                icon={<FileText className="h-4 w-4" />}
                label={t('Notes')}
                value={reservation.notes}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
