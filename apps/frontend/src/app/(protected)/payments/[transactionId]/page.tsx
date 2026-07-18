'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { usePayment } from '@/hooks/use-payments';
import { useRestaurant } from '@/providers/restaurant-provider';
import { PaymentDetailView } from '@/components/payments/payment-detail-view';
import { PaymentActions } from '@/components/payments/payment-actions';
import { PaymentDetailSkeleton } from '@/components/payments/payment-detail-skeleton';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const transactionId = params?.['transactionId'] as string | undefined;
  const { data: payment, isLoading, isError, error } = usePayment(restaurantId, transactionId);

  return (
    <PageWrapper
      title=""
      description=""
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/payments')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Payments
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <PaymentDetailSkeleton />
      ) : isError ? (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load payment: {(error as Error)?.message || 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
      ) : payment ? (
        <div className="space-y-6">
          <PaymentActions payment={payment} />
          <PaymentDetailView payment={payment} />
        </div>
      ) : null}
    </PageWrapper>
  );
}
