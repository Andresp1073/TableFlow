'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCreateTable } from '@/hooks/use-tables';
import { TableForm } from '@/components/tables/table-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';

export default function CreateTablePage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.['id'] as string;
  const createMutation = useCreateTable();

  const handleSubmit = (data: Record<string, unknown>) => {
    createMutation.mutate(
      { restaurantId, data: data as unknown as Parameters<typeof createMutation.mutate>[0]['data'] },
      {
        onSuccess: (table) => router.push(`/restaurants/${restaurantId}/tables/${table.id}`),
      },
    );
  };

  return (
    <PageWrapper
      title="Create Table"
      description="Add a new table to this restaurant"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${restaurantId}/tables`)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Tables
        </Button>
      }
    >
      <div className="max-w-2xl">
        <TableForm
          mode="create"
          isLoading={createMutation.isPending}
          error={createMutation.error?.message ?? null}
          onSubmit={handleSubmit}
        />
      </div>
    </PageWrapper>
  );
}
