'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  DoorOpen,
  XCircle,
} from 'lucide-react';
import type { ReservationStatus } from '@/lib/reservation-types';
import { ALLOWED_TRANSITIONS } from '@/lib/reservation-types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  useCancelReservation,
  useConfirmReservation,
  useCheckInReservation,
  useCompleteReservation,
} from '@/hooks/use-reservations';
import { t } from '@/lib/i18n';

interface ReservationActionsProps {
  restaurantId: string;
  reservationId: string;
  currentStatus: ReservationStatus;
}

const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    confirmTitle: string;
    confirmDescription: string;
    confirmButton: string;
    variant: 'success' | 'danger' | 'primary' | 'ghost';
  }
> = {
  confirm: {
    label: t('Confirm'),
    icon: <CheckCircle2 className="h-4 w-4" />,
    confirmTitle: t('Confirm Reservation'),
    confirmDescription: t('Are you sure you want to confirm this reservation? The guest is expected to arrive.'),
    confirmButton: t('Confirm Reservation'),
    variant: 'success',
  },
  cancel: {
    label: t('Cancel'),
    icon: <XCircle className="h-4 w-4" />,
    confirmTitle: t('Cancel Reservation'),
    confirmDescription: t('Are you sure you want to cancel this reservation? This action cannot be undone.'),
    confirmButton: t('Cancel Reservation'),
    variant: 'danger',
  },
  check_in: {
    label: t('Check In'),
    icon: <DoorOpen className="h-4 w-4" />,
    confirmTitle: t('Check In Guest'),
    confirmDescription: t('Mark this reservation as checked in? The guest has arrived.'),
    confirmButton: t('Check In'),
    variant: 'primary',
  },
  complete: {
    label: t('Complete'),
    icon: <Check className="h-4 w-4" />,
    confirmTitle: t('Complete Reservation'),
    confirmDescription: t('Mark this reservation as completed? The guest has finished dining.'),
    confirmButton: t('Complete Reservation'),
    variant: 'primary',
  },
};

const TRANSITION_TO_ACTION: Record<string, string> = {
  confirmed: 'confirm',
  cancelled: 'cancel',
  checked_in: 'check_in',
  completed: 'complete',
};

export function ReservationActions({
  restaurantId,
  reservationId,
  currentStatus,
}: ReservationActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const confirmMutation = useConfirmReservation();
  const cancelMutation = useCancelReservation();
  const checkInMutation = useCheckInReservation();
  const completeMutation = useCompleteReservation();

  const mutations: Record<string, { mutateAsync: (args: { restaurantId: string; reservationId: string }) => Promise<unknown>; isPending: boolean }> = {
    confirm: confirmMutation,
    cancel: cancelMutation,
    check_in: checkInMutation,
    complete: completeMutation,
  };

  const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  const allowedActions: string[] = allowedTransitions
    .map((status) => TRANSITION_TO_ACTION[status])
    .filter((a): a is string => !!a);

  if (allowedActions.length === 0) return null;

  const handleAction = async (action: string) => {
    const mutation = mutations[action];
    if (!mutation) return;
    try {
      await mutation.mutateAsync({ restaurantId, reservationId });
      toast.success(
        t('Reservation {action} successfully.', { action: ACTION_CONFIG[action]!.label.toLowerCase() }),
      );
      setOpen((prev) => ({ ...prev, [action]: false }));
      router.refresh();
    } catch {
      toast.error(t('Failed to {action} reservation. Please try again.', { action }));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t('Reservation actions')}>
          <AlertCircle className="h-4 w-4 mr-1" aria-hidden="true" />
          {t('Actions')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {allowedActions.map((action) => {
          const config = ACTION_CONFIG[action];
          if (!config) return null;

          const isPending = mutations[action]?.isPending;

          return (
            <Dialog
              key={action}
              open={open[action]}
              onOpenChange={(isOpen) =>
                setOpen((prev) => ({ ...prev, [action]: isOpen }))
              }
            >
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  disabled={isPending}
                >
                  {config.icon}
                  <span className="ml-2">{config.label}</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{config.confirmTitle}</DialogTitle>
                  <DialogDescription>
                    {config.confirmDescription}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setOpen((prev) => ({ ...prev, [action]: false }))
                    }
                    disabled={isPending}
                  >
                    {t('Cancel')}
                  </Button>
                  <Button
                    variant={config.variant}
                    loading={isPending}
                    onClick={() => handleAction(action)}
                  >
                    {config.confirmButton}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            router.push(
              `/restaurants/${restaurantId}/reservations/${reservationId}/edit`,
            )
          }
        >
          {t('Edit Reservation')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
