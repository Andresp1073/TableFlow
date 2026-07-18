'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SettingsSkeleton } from './settings-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save } from 'lucide-react';

export function SettingsBusiness() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const { data: settings, isLoading, isError, error } = useSettings(restaurantId);
  const update = useUpdateSettings();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm();

  useEffect(() => {
    if (settings) {
      reset({
        defaultReservationDuration: settings.defaultReservationDuration,
        reservationBufferMinutes: settings.reservationBufferMinutes,
        allowWalkIns: settings.allowWalkIns,
        autoConfirmReservations: settings.autoConfirmReservations,
        maxReservationsPerCustomer: settings.maxReservationsPerCustomer,
        reservationCancellationHours: settings.reservationCancellationHours,
      });
    }
  }, [settings, reset]);

  const allowWalkIns = watch('allowWalkIns');
  const autoConfirm = watch('autoConfirmReservations');

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!restaurantId) return;
    try {
      await update.mutateAsync({
        restaurantId,
        data: {
          defaultReservationDuration: Number(data['defaultReservationDuration']),
          reservationBufferMinutes: Number(data['reservationBufferMinutes']),
          allowWalkIns: Boolean(data['allowWalkIns']),
          autoConfirmReservations: Boolean(data['autoConfirmReservations']),
          maxReservationsPerCustomer: Number(data['maxReservationsPerCustomer']),
          reservationCancellationHours: Number(data['reservationCancellationHours']),
        },
      });
      toast.success(t('Business settings updated successfully'));
    } catch {
      toast.error(t('Failed to update business settings'));
    }
  };

  if (!current) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('Select a restaurant to configure business settings.')}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) return <SettingsSkeleton />;

  if (isError) {
    return (
      <Alert variant="error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('Failed to load settings:')} {(error as Error)?.message || t('Unexpected error')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{t('Business Settings')}</CardTitle>
          <CardDescription>
            {t('Configure reservation defaults, walk-in policy, and other business rules.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="defaultReservationDuration">
              {t('Default Reservation Duration (minutes)')}
            </Label>
            <Input
              id="defaultReservationDuration"
              type="number"
              min="15"
              max="480"
              step="15"
              {...register('defaultReservationDuration', { valueAsNumber: true })}
              aria-label={t('Default reservation duration in minutes')}
            />
            {errors.defaultReservationDuration && (
              <p className="text-sm text-destructive">
                {errors.defaultReservationDuration.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reservationBufferMinutes">{t('Buffer Between Reservations (minutes)')}</Label>
            <Input
              id="reservationBufferMinutes"
              type="number"
              min="0"
              max="120"
              {...register('reservationBufferMinutes', { valueAsNumber: true })}
              aria-label={t('Buffer time between reservations in minutes')}
            />
            {errors.reservationBufferMinutes && (
              <p className="text-sm text-destructive">
                {errors.reservationBufferMinutes.message as string}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="allowWalkIns"
              checked={!!allowWalkIns}
              onCheckedChange={(v) => setValue('allowWalkIns', v, { shouldDirty: true })}
              aria-label={t('Allow walk-in customers')}
            />
            <Label htmlFor="allowWalkIns" className="cursor-pointer">{t('Allow Walk-ins')}</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="autoConfirmReservations"
              checked={!!autoConfirm}
              onCheckedChange={(v) => setValue('autoConfirmReservations', v, { shouldDirty: true })}
              aria-label={t('Auto-confirm reservations')}
            />
            <Label htmlFor="autoConfirmReservations" className="cursor-pointer">
              {t('Auto-confirm Reservations')}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxReservationsPerCustomer">{t('Max Reservations Per Customer')}</Label>
            <Input
              id="maxReservationsPerCustomer"
              type="number"
              min="1"
              max="100"
              {...register('maxReservationsPerCustomer', { valueAsNumber: true })}
              aria-label={t('Maximum reservations per customer')}
            />
            {errors.maxReservationsPerCustomer && (
              <p className="text-sm text-destructive">
                {errors.maxReservationsPerCustomer.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reservationCancellationHours">
              {t('Reservation Cancellation Window (hours)')}
            </Label>
            <Input
              id="reservationCancellationHours"
              type="number"
              min="0"
              max="720"
              {...register('reservationCancellationHours', { valueAsNumber: true })}
              aria-label={t('Reservation cancellation window in hours')}
            />
            {errors.reservationCancellationHours && (
              <p className="text-sm text-destructive">
                {errors.reservationCancellationHours.message as string}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" disabled={!isDirty || update.isPending}>
              <Save className="h-4 w-4 mr-1.5" />
              {update.isPending ? t('Saving...') : t('Save Changes')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
