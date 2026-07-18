'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTableSchema, updateTableSchema } from '@/lib/table-schemas';
import type { RestaurantTable } from '@/lib/table-types';
import { TABLE_SHAPE_OPTIONS } from '@/lib/table-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { t } from '@/lib/i18n';

interface TableFormProps {
  mode: 'create' | 'edit';
  initialData?: RestaurantTable;
  diningAreaId?: string | null;
  branchId?: string;
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function TableForm({
  mode,
  initialData,
  diningAreaId,
  branchId,
  isLoading = false,
  error = null,
  onSubmit,
}: TableFormProps) {
  const schema = mode === 'create' ? createTableSchema : updateTableSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          branchId: initialData.branchId,
          diningAreaId: initialData.diningAreaId ?? diningAreaId,
          tableNumber: initialData.tableNumber,
          name: initialData.name ?? '',
          description: initialData.description ?? '',
          minimumCapacity: initialData.minimumCapacity,
          maximumCapacity: initialData.maximumCapacity,
          currentCapacity: initialData.currentCapacity,
          shape: initialData.shape,
          width: initialData.width,
          height: initialData.height,
          positionX: initialData.positionX,
          positionY: initialData.positionY,
          rotation: initialData.rotation,
          isReservable: initialData.isReservable,
          isAccessible: initialData.isAccessible,
          isActive: initialData.isActive,
        }
      : {
          branchId: branchId ?? '',
          diningAreaId: diningAreaId ?? '',
          tableNumber: '',
          name: '',
          description: '',
          minimumCapacity: 2,
          maximumCapacity: 4,
          currentCapacity: 0,
          shape: 'rectangle',
          width: 60,
          height: 60,
          positionX: undefined,
          positionY: undefined,
          rotation: 0,
          isReservable: true,
          isAccessible: true,
          isActive: true,
        },
  });

  const selectedShape = watch('shape');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField name="tableNumber" error={errors.tableNumber?.message}>
          <FormItem>
            <FormLabel required>{t('Table Number')}</FormLabel>
            <FormControl>
              <Input placeholder={t('T01')} disabled={isLoading} {...register('tableNumber')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="name" error={errors.name?.message}>
          <FormItem>
            <FormLabel>{t('Name')}</FormLabel>
            <FormControl>
              <Input placeholder={t('Window Table 1')} disabled={isLoading} {...register('name')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="shape" error={errors.shape?.message}>
          <FormItem>
            <FormLabel>{t('Shape')}</FormLabel>
            <FormControl>
              <Select
                value={selectedShape ?? 'rectangle'}
                onValueChange={(v) => setValue('shape', v as 'square' | 'rectangle' | 'round' | 'oval')}
                disabled={isLoading}
              >
                <SelectTrigger aria-label={t('Table shape')}>
                  <SelectValue placeholder={t('Select shape')} />
                </SelectTrigger>
                <SelectContent>
                  {TABLE_SHAPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField name="minimumCapacity" error={errors.minimumCapacity?.message}>
            <FormItem>
              <FormLabel required>{t('Min Capacity')}</FormLabel>
              <FormControl>
                <Input type="number" placeholder={t('2')} disabled={isLoading} {...register('minimumCapacity')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="maximumCapacity" error={errors.maximumCapacity?.message}>
            <FormItem>
              <FormLabel required>{t('Max Capacity')}</FormLabel>
              <FormControl>
                <Input type="number" placeholder={t('4')} disabled={isLoading} {...register('maximumCapacity')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField name="width" error={errors.width?.message}>
            <FormItem>
              <FormLabel>{t('Width (px)')}</FormLabel>
              <FormControl>
                <Input type="number" placeholder={t('60')} disabled={isLoading} {...register('width')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField name="height" error={errors.height?.message}>
            <FormItem>
              <FormLabel>{t('Height (px)')}</FormLabel>
              <FormControl>
                <Input type="number" placeholder={t('60')} disabled={isLoading} {...register('height')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>
        </div>
      </div>

      <FormField name="description" error={errors.description?.message}>
        <FormItem>
            <FormLabel>{t('Description')}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={t('Describe this table...')}
              disabled={isLoading}
              rows={2}
              {...register('description')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="isReservable"
            disabled={isLoading}
            {...register('isReservable')}
          />
          <Label htmlFor="isReservable" className="text-sm font-normal cursor-pointer">
            {t('Reservable')}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="isAccessible"
            disabled={isLoading}
            {...register('isAccessible')}
          />
          <Label htmlFor="isAccessible" className="text-sm font-normal cursor-pointer">
            {t('Wheelchair Accessible')}
          </Label>
        </div>
        {mode === 'edit' && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              disabled={isLoading}
              {...register('isActive')}
            />
            <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
              {t('Active')}
            </Label>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="submit" loading={isLoading}>
          {isLoading ? t('Saving...') : mode === 'create' ? t('Create Table') : t('Save Changes')}
        </Button>
      </div>
    </form>
  );
}
