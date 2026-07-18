'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useBusinessHours, useUpdateBusinessHours } from '@/hooks/use-settings';
import { DAY_NAMES } from '@/lib/settings-types';
import type { DayScheduleDTO } from '@/lib/settings-types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SettingsSkeleton } from './settings-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Trash2, Save } from 'lucide-react';

interface PeriodEntry {
  openTime: string;
  closeTime: string;
}

interface DayEntry {
  dayOfWeek: number;
  isClosed: boolean;
  periods: PeriodEntry[];
}

function defaultPeriods(): PeriodEntry[] {
  return [{ openTime: '09:00', closeTime: '17:00' }];
}

function defaultSchedules(): DayEntry[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i + 1,
    isClosed: i >= 5,
    periods: i >= 5 ? [] : defaultPeriods(),
  }));
}

function toApiSchedules(entries: DayEntry[]): DayScheduleDTO[] {
  return entries.map((e) => ({
    dayOfWeek: e.dayOfWeek,
    isClosed: e.isClosed,
    periods: e.isClosed ? [] : e.periods.map((p, idx) => ({
      openTime: p.openTime,
      closeTime: p.closeTime,
      order: idx,
    })),
  }));
}

function fromApiSchedules(schedules: DayScheduleDTO[]): DayEntry[] {
  if (!schedules || schedules.length === 0) return defaultSchedules();
  return Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    const existing = schedules.find((s) => s.dayOfWeek === dayNum);
    if (!existing) {
      return { dayOfWeek: dayNum, isClosed: true, periods: [] };
    }
    return {
      dayOfWeek: dayNum,
      isClosed: existing.isClosed,
      periods: existing.isClosed ? [] : existing.periods.map((p) => ({
        openTime: p.openTime,
        closeTime: p.closeTime,
      })),
    };
  });
}

export function SettingsBusinessHours() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const { data: businessHours, isLoading, isError, error } = useBusinessHours(restaurantId);
  const update = useUpdateBusinessHours();

  const [entries, setEntries] = useState<DayEntry[]>(defaultSchedules());
  const [initialEntries, setInitialEntries] = useState<string>('');
  const isDirty = JSON.stringify(entries) !== initialEntries;

  useEffect(() => {
    if (businessHours?.schedules) {
      const parsed = fromApiSchedules(businessHours.schedules);
      setEntries(parsed);
      setInitialEntries(JSON.stringify(parsed));
    }
  }, [businessHours]);

  const handleToggleDay = useCallback((dayOfWeek: number, closed: boolean) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.dayOfWeek === dayOfWeek
          ? { ...e, isClosed: closed, periods: closed ? [] : defaultPeriods() }
          : e,
      ),
    );
  }, []);

  const handlePeriodChange = useCallback(
    (dayOfWeek: number, periodIdx: number, field: 'openTime' | 'closeTime', value: string) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.dayOfWeek === dayOfWeek
            ? {
                ...e,
                periods: e.periods.map((p, idx) =>
                  idx === periodIdx ? { ...p, [field]: value } : p,
                ),
              }
            : e,
        ),
      );
    },
    [],
  );

  const handleAddPeriod = useCallback((dayOfWeek: number) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.dayOfWeek === dayOfWeek
          ? { ...e, periods: [...e.periods, { openTime: '12:00', closeTime: '13:00' }] }
          : e,
      ),
    );
  }, []);

  const handleRemovePeriod = useCallback((dayOfWeek: number, periodIdx: number) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.dayOfWeek === dayOfWeek
          ? { ...e, periods: e.periods.filter((_, idx) => idx !== periodIdx) }
          : e,
      ),
    );
  }, []);

  const handleSubmit = async () => {
    if (!restaurantId) return;
    try {
      await update.mutateAsync({
        restaurantId,
        data: { schedules: toApiSchedules(entries) },
      });
      setInitialEntries(JSON.stringify(entries));
      toast.success('Business hours updated successfully');
    } catch {
      toast.error('Failed to update business hours');
    }
  };

  if (!current) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Select a restaurant to configure business hours.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) return <SettingsSkeleton />;

  if (isError) {
    return (
      <Alert variant="error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load business hours: {(error as Error)?.message || 'Unexpected error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Hours</CardTitle>
        <CardDescription>
          Set opening and closing hours for each day of the week.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.dayOfWeek}
            className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-lg border"
          >
            <div className="flex items-center gap-3 sm:w-48 shrink-0">
              <Switch
                id={`day-${entry.dayOfWeek}`}
                checked={!entry.isClosed}
                onCheckedChange={(checked) => handleToggleDay(entry.dayOfWeek, !checked)}
                aria-label={`${DAY_NAMES[entry.dayOfWeek]} ${entry.isClosed ? 'closed' : 'open'}`}
              />
              <Label htmlFor={`day-${entry.dayOfWeek}`} className="font-medium cursor-pointer">
                {DAY_NAMES[entry.dayOfWeek]}
              </Label>
            </div>

            {!entry.isClosed && (
              <div className="flex-1 space-y-2">
                {entry.periods.map((period, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`open-${entry.dayOfWeek}-${idx}`} className="sr-only">
                        Open time
                      </Label>
                      <Input
                        id={`open-${entry.dayOfWeek}-${idx}`}
                        type="time"
                        value={period.openTime}
                        onChange={(e) => handlePeriodChange(entry.dayOfWeek, idx, 'openTime', e.target.value)}
                        className="w-32"
                        aria-label={`Open time for ${DAY_NAMES[entry.dayOfWeek]} period ${idx + 1}`}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Label htmlFor={`close-${entry.dayOfWeek}-${idx}`} className="sr-only">
                        Close time
                      </Label>
                      <Input
                        id={`close-${entry.dayOfWeek}-${idx}`}
                        type="time"
                        value={period.closeTime}
                        onChange={(e) => handlePeriodChange(entry.dayOfWeek, idx, 'closeTime', e.target.value)}
                        className="w-32"
                        aria-label={`Close time for ${DAY_NAMES[entry.dayOfWeek]} period ${idx + 1}`}
                      />
                    </div>
                    {entry.periods.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePeriod(entry.dayOfWeek, idx)}
                        aria-label={`Remove period ${idx + 1} for ${DAY_NAMES[entry.dayOfWeek]}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPeriod(entry.dayOfWeek)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Period
                </Button>
              </div>
            )}

            {entry.isClosed && (
              <p className="text-sm text-muted-foreground italic pt-2 sm:pt-0">{t('Closed')}</p>
            )}
          </div>
        ))}

        <div className="flex items-center gap-4 pt-2">
          <Button onClick={handleSubmit} disabled={!isDirty || update.isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            {update.isPending ? t('Saving...') : t('Save Changes')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
