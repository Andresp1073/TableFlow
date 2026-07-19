'use client';

import { t } from '@/lib/i18n';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useSettings } from '@/hooks/use-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SettingsSkeleton } from './settings-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { DAY_NAMES } from '@/lib/settings-types';

export function SettingsDashboard() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const { data: settings, isLoading, isError, error } = useSettings(restaurantId);

  if (!current) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('Select a restaurant to view settings.')}</AlertDescription>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Settings Overview')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Restaurant')}</p>
            <p className="font-medium">{current.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Status')}</p>
            <Badge variant="success">{t('Active')}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Timezone')}</p>
            <p className="font-medium">{settings?.timezone ?? 'UTC'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Currency')}</p>
            <p className="font-medium">{settings?.currency ?? 'USD'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Language')}</p>
            <p className="font-medium">{settings?.language ?? 'en'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Date Format')}</p>
            <p className="font-medium">{settings?.dateFormat ?? 'YYYY-MM-DD'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Time Format')}</p>
            <p className="font-medium">{settings?.timeFormat ?? 'HH:mm'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Week Starts On')}</p>
            <p className="font-medium">
              {settings?.weekStartsOn != null ? t(DAY_NAMES[settings.weekStartsOn === 0 ? 7 : settings.weekStartsOn] ?? '') || t('Sunday') : t('Sunday')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Tax Rate')}</p>
            <p className="font-medium">{settings?.taxPercentage ?? 0}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Service Charge')}</p>
            <p className="font-medium">{settings?.serviceChargePercentage ?? 0}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Reservation Duration')}</p>
            <p className="font-medium">{settings?.defaultReservationDuration ?? 60} min</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Buffer Time')}</p>
            <p className="font-medium">{settings?.reservationBufferMinutes ?? 15} min</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Walk-ins')}</p>
            <Badge variant={settings?.allowWalkIns ? 'success' : 'secondary'}>
              {settings?.allowWalkIns ? t('Allowed') : t('Not Allowed')}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Auto-confirm')}</p>
            <Badge variant={settings?.autoConfirmReservations ? 'success' : 'secondary'}>
              {settings?.autoConfirmReservations ? t('Enabled') : t('Disabled')}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Max Reservations')}</p>
            <p className="font-medium">{settings?.maxReservationsPerCustomer ?? 10} {t('per customer')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{t('Cancellation Window')}</p>
            <p className="font-medium">{settings?.reservationCancellationHours ?? 24} {t('hours')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
