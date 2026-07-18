'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRestaurant } from '@/providers/restaurant-provider';
import type { PaymentTransaction } from '@/lib/payment-types';
import {  formatCurrency } from '@/lib/payment-types';
import { t } from '@/lib/i18n';
import { useRefundPayment } from '@/hooks/use-payments';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, ArrowLeft } from 'lucide-react';

interface PaymentActionsProps {
  payment: PaymentTransaction;
}

export function PaymentActions({ payment }: PaymentActionsProps) {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? '';
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const refundMutation = useRefundPayment();

  const remainingRefundable = payment.amount - payment.refundedAmount;
  const canRefund = payment.status === 'captured' && remainingRefundable > 0;

  const handleRefund = async () => {
    if (!restaurantId) return;
    const amount = refundAmount ? parseFloat(refundAmount) : remainingRefundable;
    if (isNaN(amount) || amount <= 0 || amount > remainingRefundable) return;

    refundMutation.mutate(
      {
        restaurantId,
        transactionId: payment.id,
        data: { amount, reason: refundReason || undefined },
      },
      {
        onSuccess: () => {
          setShowRefundDialog(false);
          setRefundAmount('');
          setRefundReason('');
          router.refresh();
        },
      },
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/payments')}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          {t('Back to Payments')}
        </Button>

        {canRefund && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefundAmount('');
              setRefundReason('');
              setShowRefundDialog(true);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {t('Refund')}
          </Button>
        )}
      </div>

      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Process Refund')}</DialogTitle>
            <DialogDescription>
              {t('Refund payment of {amount}. Remaining refundable: {remaining}.', { amount: formatCurrency(payment.amount), remaining: formatCurrency(remainingRefundable) })}
            </DialogDescription>
          </DialogHeader>

          {refundMutation.error && (
            <Alert variant="error">
              <AlertDescription>{refundMutation.error.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">
                {t('Refund Amount ({max} max)', { max: formatCurrency(remainingRefundable) })}
              </Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingRefundable}
                placeholder={String(remainingRefundable)}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                disabled={refundMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                {t('Leave empty for full refund ({amount})', { amount: formatCurrency(remainingRefundable) })}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">{t('Reason (optional)')}</Label>
              <Input
                id="refund-reason"
                placeholder={t('Customer request, duplicate charge, etc.')}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                disabled={refundMutation.isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
              disabled={refundMutation.isPending}
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleRefund}
              loading={refundMutation.isPending}
              disabled={!remainingRefundable}
            >
              {refundMutation.isPending ? t('Processing...') : t('Process Refund')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
