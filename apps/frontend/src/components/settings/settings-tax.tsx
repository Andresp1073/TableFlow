'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { updateSettingsSchema } from '@/lib/settings-schemas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SettingsSkeleton } from './settings-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save } from 'lucide-react';

export function SettingsTax() {
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const { data: settings, isLoading, isError, error } = useSettings(restaurantId);
  const update = useUpdateSettings();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    resolver: zodResolver(updateSettingsSchema),
  });

  useEffect(() => {
    if (settings) {
      reset({
        taxPercentage: settings.taxPercentage,
        serviceChargePercentage: settings.serviceChargePercentage,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!restaurantId) return;
    try {
      await update.mutateAsync({
        restaurantId,
        data: {
          taxPercentage: Number(data['taxPercentage']),
          serviceChargePercentage: Number(data['serviceChargePercentage']),
        },
      });
      toast.success('Tax settings updated successfully');
    } catch {
      toast.error('Failed to update tax settings');
    }
  };

  if (!current) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Select a restaurant to configure tax settings.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) return <SettingsSkeleton />;

  if (isError) {
    return (
      <Alert variant="error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load settings: {(error as Error)?.message || 'Unexpected error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Tax Settings</CardTitle>
          <CardDescription>
            Configure tax rate and service charge percentage for your restaurant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="taxPercentage">Tax Rate (%)</Label>
            <Input
              id="taxPercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('taxPercentage', { valueAsNumber: true })}
              aria-label="Tax rate percentage"
            />
            {errors.taxPercentage && (
              <p className="text-sm text-destructive">{errors.taxPercentage.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceChargePercentage">Service Charge (%)</Label>
            <Input
              id="serviceChargePercentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('serviceChargePercentage', { valueAsNumber: true })}
              aria-label="Service charge percentage"
            />
            {errors.serviceChargePercentage && (
              <p className="text-sm text-destructive">
                {errors.serviceChargePercentage.message as string}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" disabled={!isDirty || update.isPending}>
              <Save className="h-4 w-4 mr-1.5" />
              {update.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
