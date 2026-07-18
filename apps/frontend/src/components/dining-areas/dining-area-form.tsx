'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createDiningAreaSchema,
  updateDiningAreaSchema,
} from '@/lib/dining-area-schemas';
import type { DiningArea } from '@/lib/dining-area-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DiningAreaFormProps {
  mode: 'create' | 'edit';
  initialData?: DiningArea;
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function DiningAreaForm({ mode, initialData, isLoading = false, error = null, onSubmit }: DiningAreaFormProps) {
  const schema = mode === 'create' ? createDiningAreaSchema : updateDiningAreaSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          code: initialData.code,
          description: initialData.description ?? '',
          displayOrder: initialData.displayOrder,
          isReservable: initialData.isReservable,
        }
      : {
          name: '',
          code: '',
          description: '',
          displayOrder: 0,
          isReservable: true,
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
        <FormField name="name" error={errors.name?.message}>
          <FormItem>
            <FormLabel required>Name</FormLabel>
            <FormControl>
              <Input placeholder="Main Hall" disabled={isLoading} {...register('name')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="code" error={errors.code?.message}>
          <FormItem>
            <FormLabel required>Code</FormLabel>
            <FormControl>
              <Input placeholder="MAIN_HALL" disabled={isLoading} {...register('code')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="displayOrder" error={errors.displayOrder?.message}>
          <FormItem>
            <FormLabel>Display Order</FormLabel>
            <FormControl>
              <Input type="number" placeholder="0" disabled={isLoading} {...register('displayOrder')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div className="flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isReservable"
              disabled={isLoading}
              {...register('isReservable')}
            />
            <Label htmlFor="isReservable" className="text-sm font-normal cursor-pointer">
              Reservable
            </Label>
          </div>
        </div>
      </div>

      <FormField name="description" error={errors.description?.message}>
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe this dining area..."
              disabled={isLoading}
              rows={3}
              {...register('description')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div className="flex gap-3 justify-end">
        <Button type="submit" loading={isLoading}>
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Dining Area' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
