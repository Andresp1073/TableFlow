'use client';
import { t } from '@/lib/i18n';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  type CreateRestaurantFormData,
  type UpdateRestaurantFormData,
} from '@/lib/restaurant-schemas';
import type { Restaurant } from '@/lib/restaurant-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RestaurantFormProps {
  mode: 'create' | 'edit';
  initialData?: Restaurant;
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function RestaurantForm({ mode, initialData, isLoading = false, error = null, onSubmit }: RestaurantFormProps) {
  const schema = mode === 'create' ? createRestaurantSchema : updateRestaurantSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRestaurantFormData | UpdateRestaurantFormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          legalName: initialData.legalName ?? '',
          taxId: initialData.taxId ?? '',
          email: initialData.email ?? '',
          phone: initialData.phone ?? '',
          website: initialData.website ?? '',
          address: initialData.address ?? '',
          logoUrl: initialData.logoUrl ?? '',
          timezone: initialData.timezone,
          currency: initialData.currency,
          language: initialData.language,
        }
      : {
          name: '',
          slug: '',
          legalName: '',
          taxId: '',
          email: '',
          phone: '',
          website: '',
          address: '',
          logoUrl: '',
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
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
            <FormLabel required>{t('Name')}</FormLabel>
            <FormControl>
              <Input placeholder={t("My Restaurant")} disabled={isLoading} {...register('name')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="slug" error={errors.slug?.message}>
          <FormItem>
            <FormLabel required>{t('Slug')}</FormLabel>
            <FormControl>
              <Input placeholder={t("my-restaurant")} disabled={isLoading} {...register('slug')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="legalName" error={errors.legalName?.message}>
          <FormItem>
            <FormLabel>{t('Legal Name')}</FormLabel>
            <FormControl>
              <Input placeholder={t("My Restaurant LLC")} disabled={isLoading} {...register('legalName')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="taxId" error={errors.taxId?.message}>
          <FormItem>
            <FormLabel>{t('Tax ID')}</FormLabel>
            <FormControl>
              <Input placeholder={t("XX-XXXXXXX")} disabled={isLoading} {...register('taxId')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="email" error={errors.email?.message}>
          <FormItem>
            <FormLabel>{t('Email')}</FormLabel>
            <FormControl>
              <Input type="email" placeholder={t("contact@example.com")} disabled={isLoading} {...register('email')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="phone" error={errors.phone?.message}>
          <FormItem>
            <FormLabel>{t('Phone')}</FormLabel>
            <FormControl>
              <Input type="tel" placeholder={t("+1 555-123-4567")} disabled={isLoading} {...register('phone')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="website" error={errors.website?.message}>
          <FormItem>
            <FormLabel>{t('Website')}</FormLabel>
            <FormControl>
              <Input placeholder={t("https://example.com")} disabled={isLoading} {...register('website')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="logoUrl" error={errors.logoUrl?.message}>
          <FormItem>
            <FormLabel>{t('Logo URL')}</FormLabel>
            <FormControl>
              <Input placeholder={t("https://example.com/logo.png")} disabled={isLoading} {...register('logoUrl')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="timezone" error={errors.timezone?.message}>
          <FormItem>
            <FormLabel required>{t('Timezone')}</FormLabel>
            <FormControl>
              <Input placeholder={t("America/New_York")} disabled={isLoading} {...register('timezone')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="currency" error={errors.currency?.message}>
          <FormItem>
            <FormLabel required>{t('Currency')}</FormLabel>
            <FormControl>
              <Input placeholder={t("USD")} disabled={isLoading} {...register('currency')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="language" error={errors.language?.message}>
          <FormItem>
            <FormLabel required>{t('Language')}</FormLabel>
            <FormControl>
              <Input placeholder={t("en")} disabled={isLoading} {...register('language')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <FormField name="address" error={errors.address?.message}>
        <FormItem>
            <FormLabel>{t('Address')}</FormLabel>
          <FormControl>
            <Input placeholder={t("123 Main St, City, State ZIP")} disabled={isLoading} {...register('address')} />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div className="flex gap-3 justify-end">
        <Button type="submit" loading={isLoading}>
          {isLoading ? t('Saving...') : mode === 'create' ? t('Create Restaurant') : t('Save Changes')}
        </Button>
      </div>
    </form>
  );
}
