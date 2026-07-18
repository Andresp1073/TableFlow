'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createReservationSchema,
  updateReservationSchema,
} from '@/lib/reservation-schemas';
import type { ReservationDTO } from '@/lib/reservation-types';
import { RESERVATION_SOURCE_OPTIONS } from '@/lib/reservation-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReservationFormProps {
  mode: 'create' | 'edit';
  initialData?: ReservationDTO;
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function ReservationForm({
  mode,
  initialData,
  isLoading = false,
  error = null,
  onSubmit,
}: ReservationFormProps) {
  const schema = mode === 'create' ? createReservationSchema : updateReservationSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          reservationNumber: initialData.reservationNumber,
          customerId: initialData.customerId ?? '',
          tableId: initialData.tableId ?? '',
          tableGroupId: initialData.tableGroupId ?? '',
          date: initialData.date?.split('T')[0] ?? '',
          startTime: initialData.startTime ?? '',
          endTime: initialData.endTime ?? '',
          partySize: initialData.partySize,
          source: initialData.source,
          notes: initialData.notes ?? '',
          specialRequests: initialData.specialRequests ?? '',
        }
      : {
          reservationNumber: '',
          customerId: '',
          tableId: '',
          tableGroupId: '',
          date: '',
          startTime: '',
          endTime: '',
          partySize: 2,
          source: 'staff',
          notes: '',
          specialRequests: '',
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField name="reservationNumber" error={errors.reservationNumber?.message}>
          <FormItem>
            <FormLabel required>Reservation Number</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. RES-001"
                disabled={isLoading || mode === 'edit'}
                {...register('reservationNumber')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="partySize" error={errors.partySize?.message}>
          <FormItem>
            <FormLabel required>Party Size</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="2"
                disabled={isLoading}
                {...register('partySize')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="date" error={errors.date?.message}>
          <FormItem>
            <FormLabel required>Date</FormLabel>
            <FormControl>
              <Input type="date" disabled={isLoading} {...register('date')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField name="startTime" error={errors.startTime?.message}>
            <FormItem>
              <FormLabel required>Start Time</FormLabel>
              <FormControl>
                <Input type="time" disabled={isLoading} {...register('startTime')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="endTime" error={errors.endTime?.message}>
            <FormItem>
              <FormLabel required>End Time</FormLabel>
              <FormControl>
                <Input type="time" disabled={isLoading} {...register('endTime')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <FormField name="source" error={errors.source?.message}>
          <FormItem>
            <FormLabel required>Source</FormLabel>
            <FormControl>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                {...register('source')}
              >
                {RESERVATION_SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        {mode === 'create' && (
          <FormField name="customerId" error={errors.customerId?.message}>
            <FormItem>
              <FormLabel>Customer ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional customer UUID"
                  disabled={isLoading}
                  {...register('customerId')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        )}

        {mode === 'create' && (
          <FormField name="tableId" error={errors.tableId?.message}>
            <FormItem>
              <FormLabel>Table ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional table UUID"
                  disabled={isLoading}
                  {...register('tableId')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        )}
      </div>

      <FormField name="specialRequests" error={errors.specialRequests?.message}>
        <FormItem>
          <FormLabel>Special Requests</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Any special requests from the guest..."
              disabled={isLoading}
              rows={3}
              {...register('specialRequests')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField name="notes" error={errors.notes?.message}>
        <FormItem>
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Internal notes..."
              disabled={isLoading}
              rows={3}
              {...register('notes')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div className="flex gap-3 justify-end">
        <Button type="submit" loading={isLoading}>
          {isLoading
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Reservation'
              : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
