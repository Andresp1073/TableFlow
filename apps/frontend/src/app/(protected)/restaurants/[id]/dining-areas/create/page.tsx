'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCreateDiningArea } from '@/hooks/use-dining-areas';
import { DiningAreaForm } from '@/components/dining-areas/dining-area-form';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';

export default function CreateDiningAreaPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.['id'] as string;
  const createMutation = useCreateDiningArea();

  const handleSubmit = (data: Record<string, unknown>) => {
    createMutation.mutate(
      { restaurantId, data: data as unknown as Parameters<typeof createMutation.mutate>[0]['data'] },
      {
        onSuccess: (area) => router.push(`/restaurants/${restaurantId}/dining-areas/${area.id}`),
      },
    );
  };

  return (
    <PageWrapper
      title="Create Dining Area"
      description="Add a new dining area to this restaurant"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.push(`/restaurants/${restaurantId}/dining-areas`)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Dining Areas
        </Button>
      }
    >
      <div className="max-w-2xl">
        <DiningAreaForm
          mode="create"
          isLoading={createMutation.isPending}
          error={createMutation.error?.message ?? null}
          onSubmit={handleSubmit}
        />
      </div>
    </PageWrapper>
  );
}
