'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, LayoutPanelTop } from 'lucide-react';
import { useTable, useTableTransitions } from '@/hooks/use-tables';
import { TableDetailView } from '@/components/tables/table-detail-view';
import { TableActions } from '@/components/tables/table-actions';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.['id'] as string | undefined;
  const tableId = params?.['tableId'] as string | undefined;
  const { data: table, isLoading, isError, error } = useTable(restaurantId, tableId);
  const { data: transitions } = useTableTransitions(restaurantId, tableId);

  return (
    <PageWrapper
      title=""
      description=""
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${restaurantId}/tables`)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t('Back to Tables')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/restaurants/${restaurantId}/tables/floor-plan`)}
          >
            <LayoutPanelTop className="h-4 w-4 mr-1.5" />
            {t('Floor Plan')}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-6 space-y-4">
                <Skeleton className="h-5 w-40" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('Failed to load table')}: {(error as Error)?.message || t('An unexpected error occurred')}
          </AlertDescription>
        </Alert>
      ) : table ? (
        <div className="space-y-6">
          <TableActions
            table={table}
            allowedTransitions={transitions?.allowedTransitions}
            showViewOnFloorPlan
            onViewOnFloorPlan={() => router.push(`/restaurants/${restaurantId}/tables/floor-plan?selected=${table.id}`)}
          />
          <TableDetailView table={table} />
        </div>
      ) : null}
    </PageWrapper>
  );
}
