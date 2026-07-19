'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { t } from '@/lib/i18n';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { updateSettingsSchema, type UpdateSettingsFormData } from '@/lib/settings-schemas';
import {
  TIMEZONE_OPTIONS, CURRENCY_OPTIONS, LANGUAGE_OPTIONS,
  DATE_FORMAT_OPTIONS, TIME_FORMAT_OPTIONS, DAY_NAMES,
} from '@/lib/settings-types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SettingsSkeleton } from './settings-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save } from 'lucide-react';

export function SettingsRegional() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const { data: settings, isLoading, isError, error } = useSettings(restaurantId);
  const update = useUpdateSettings();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty, errors },
    reset,
  } = useForm<UpdateSettingsFormData>({
    resolver: zodResolver(updateSettingsSchema),
  });

  const watchedValues = watch();

  useEffect(() => {
    if (settings) {
      reset({
        timezone: settings.timezone,
        currency: settings.currency,
        language: settings.language,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        weekStartsOn: settings.weekStartsOn,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: UpdateSettingsFormData) => {
    if (!restaurantId) return;
    try {
      await update.mutateAsync({ restaurantId, data });
      toast.success(t('Regional settings updated successfully'));
    } catch {
      toast.error(t('Failed to update regional settings'));
    }
  };

  if (!current) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t('Select a restaurant to configure regional settings.')}</AlertDescription>
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
          <CardTitle>{t('Regional Settings')}</CardTitle>
          <CardDescription>
            {t('Configure timezone, currency, language, and date/time formats for your restaurant.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="timezone">{t('Timezone')}</Label>
            <Select
              value={watchedValues.timezone ?? settings?.timezone ?? 'UTC'}
              onValueChange={(v) => setValue('timezone', v, { shouldDirty: true })}
            >
              <SelectTrigger id="timezone" aria-label={t('Select timezone')}>
                <SelectValue placeholder={t('Select timezone')} />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{t(tz.label)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timezone && <p className="text-sm text-destructive">{errors.timezone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t('Currency')}</Label>
            <Select
              value={watchedValues.currency ?? settings?.currency ?? 'USD'}
              onValueChange={(v) => setValue('currency', v, { shouldDirty: true })}
            >
              <SelectTrigger id="currency" aria-label={t('Select currency')}>
                <SelectValue placeholder={t('Select currency')} />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{t(c.label)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">{t('Language')}</Label>
            <Select
              value={watchedValues.language ?? settings?.language ?? 'en'}
              onValueChange={(v) => setValue('language', v, { shouldDirty: true })}
            >
              <SelectTrigger id="language" aria-label={t('Select language')}>
                <SelectValue placeholder={t('Select language')} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{t(l.label)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.language && <p className="text-sm text-destructive">{errors.language.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">{t('Date Format')}</Label>
            <Select
              value={watchedValues.dateFormat ?? settings?.dateFormat ?? 'YYYY-MM-DD'}
              onValueChange={(v) => setValue('dateFormat', v, { shouldDirty: true })}
            >
              <SelectTrigger id="dateFormat" aria-label={t('Select date format')}>
                <SelectValue placeholder={t('Select date format')} />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{t(f.label)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dateFormat && <p className="text-sm text-destructive">{errors.dateFormat.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeFormat">{t('Time Format')}</Label>
            <Select
              value={watchedValues.timeFormat ?? settings?.timeFormat ?? 'HH:mm'}
              onValueChange={(v) => setValue('timeFormat', v, { shouldDirty: true })}
            >
              <SelectTrigger id="timeFormat" aria-label={t('Select time format')}>
                <SelectValue placeholder={t('Select time format')} />
              </SelectTrigger>
              <SelectContent>
                {TIME_FORMAT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{t(f.label)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timeFormat && <p className="text-sm text-destructive">{errors.timeFormat.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekStartsOn">{t('Week Starts On')}</Label>
            <Select
              value={String(watchedValues.weekStartsOn ?? settings?.weekStartsOn ?? 0)}
              onValueChange={(v) => setValue('weekStartsOn', Number(v), { shouldDirty: true })}
            >
              <SelectTrigger id="weekStartsOn" aria-label={t('Select first day of week')}>
                <SelectValue placeholder={t('Select day')} />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {t(DAY_NAMES[d === 0 ? 7 : d] ?? 'Sunday')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
