'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCreateTable } from '@/hooks/use-tables';
import { useRestaurant } from '@/providers/restaurant-provider';
import { TableForm } from '@/components/tables/table-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';

export default function CreateTablePage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const createMutation = useCreateTable();

  const handleSubmit = (data: Record<string, unknown>) => {
    createMutation.mutate(
      { restaurantId, data: data as unknown as Parameters<typeof createMutation.mutate>[0]['data'] },
      {
        onSuccess: (table) => router.push(`/tables/${table.id}`),
      },
    );
  };

  return (
    <PageWrapper
      title="Create Table"
      description="Add a new table to the floor plan"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push('/tables')}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Tables
        </Button>
      }
    >
      <div className="max-w-2xl">
        {!restaurantId ? (
          <p className="text-sm text-muted-foreground">Select a restaurant to create a table.</p>
        ) : (
          <TableForm
            mode="create"
            isLoading={createMutation.isPending}
            error={createMutation.error?.message ?? null}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </PageWrapper>
  );
}
