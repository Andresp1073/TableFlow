'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useTable, useUpdateTable } from '@/hooks/use-tables';
import { useRestaurant } from '@/providers/restaurant-provider';
import { TableForm } from '@/components/tables/table-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { t } from '@/lib/i18n';

export default function EditTablePage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const tableId = params?.['tableId'] as string | undefined;
  const { data: table, isLoading, isError, error } = useTable(restaurantId, tableId);
  const updateMutation = useUpdateTable();

  const handleSubmit = (data: Record<string, unknown>) => {
    if (!restaurantId || !tableId) return;
    updateMutation.mutate(
      { restaurantId, tableId, data: data as unknown as Parameters<typeof updateMutation.mutate>[0]['data'] },
      {
        onSuccess: () => router.push(`/tables/${tableId}`),
      },
    );
  };

  return (
    <PageWrapper
      title={table ? t('Edit: Table {tableNumber}', { tableNumber: table.tableNumber }) : t('Edit Table')}
      description={t('Update table configuration')}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/tables/${tableId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t('Back to Details')}
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-4 max-w-2xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('Failed to load table: {error}', { error: (error as Error)?.message || t('An unexpected error occurred') })}
          </AlertDescription>
        </Alert>
      ) : table ? (
        <div className="max-w-2xl">
          <TableForm
            mode="edit"
            initialData={table}
            isLoading={updateMutation.isPending}
            error={updateMutation.error?.message ?? null}
            onSubmit={handleSubmit}
          />
        </div>
      ) : null}
    </PageWrapper>
  );
}
