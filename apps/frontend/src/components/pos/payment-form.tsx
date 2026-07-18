'use client';
import { t, formatCurrency } from '@/lib/i18n';

import { useState } from 'react';
import { CreditCard, Banknote, Wallet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import type { ProcessPaymentInput } from '@/lib/sales-types';
import type { PaymentResult } from '@/lib/sales-types';

interface PaymentFormProps {
  total: number;
  isProcessing: boolean;
  onProcessPayment: (data: ProcessPaymentInput) => void;
  paymentResult: PaymentResult | null;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { id: 'credit_card', label: t('Credit Card'), icon: <CreditCard className="h-5 w-5" /> },
  { id: 'debit_card', label: t('Debit Card'), icon: <CreditCard className="h-5 w-5" /> },
  { id: 'cash', label: t('Cash'), icon: <Banknote className="h-5 w-5" /> },
  { id: 'digital_wallet', label: t('Digital Wallet'), icon: <Wallet className="h-5 w-5" /> },
  { id: 'contactless', label: t('Contactless'), icon: <Smartphone className="h-5 w-5" /> },
];

const PAYMENT_PROVIDERS = [
  { id: 'stripe', label: t('Stripe') },
  { id: 'square', label: t('Square') },
  { id: 'paypal', label: t('PayPal') },
];

export function PaymentForm({ total, isProcessing, onProcessPayment, paymentResult, onClose }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('stripe');
  const [tipPercent, setTipPercent] = useState(0);

  const tipAmount = Math.round(total * (tipPercent / 100) * 100) / 100;
  const totalWithTip = total + tipAmount;

  function handlePay() {
    if (!selectedMethod) return;
    onProcessPayment({
      providerId: selectedProvider,
      methodType: selectedMethod,
      tipAmount,
    });
  }

  if (paymentResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('Payment Successful')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-green-600">{formatCurrency(paymentResult.paid)}</div>
            <div className="text-sm text-muted-foreground">{t('Payment received')}</div>
          </div>
          {paymentResult.tip > 0 && (
            <div className="flex justify-between text-sm">
              <span>{t('Tip')}</span>
              <span>{formatCurrency(paymentResult.tip)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>{t('Transaction ID')}</span>
            <span className="font-mono text-xs">{paymentResult.paymentTransactionId.slice(0, 12)}</span>
          </div>
          <Button className="w-full mt-4" onClick={onClose}>
            {t('Done')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Process Payment')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-3">
          <div className="text-3xl font-bold">{formatCurrency(total)}</div>
          <div className="text-sm text-muted-foreground">{t('Total due')}</div>
        </div>

        <div className="space-y-2">
          <Label>{t('Payment Method')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <Button
                key={method.id}
                variant={selectedMethod === method.id ? 'primary' : 'outline'}
                className="h-16 flex-col gap-1"
                onClick={() => setSelectedMethod(method.id)}
                type="button"
              >
                {method.icon}
                <span className="text-xs">{method.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider">{t('Provider')}</Label>
          <select
            id="provider"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            {PAYMENT_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>{t('Tip')}</Label>
          <div className="flex gap-2">
            {[0, 10, 15, 20].map((pct) => (
              <Button
                key={pct}
                variant={tipPercent === pct ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTipPercent(pct)}
                type="button"
              >
                {pct === 0 ? t('No Tip') : `${pct}%`}
              </Button>
            ))}
          </div>
          {tipPercent > 0 && (
            <div className="text-sm text-muted-foreground">
              {t('Tip: {amount} — Total: {total}', { amount: formatCurrency(tipAmount), total: formatCurrency(totalWithTip) })}
            </div>
          )}
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handlePay}
          disabled={!selectedMethod || isProcessing}
        >
          {isProcessing ? (
            <LoadingState message={t("Processing...")} />
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              {t('Pay {amount}', { amount: formatCurrency(totalWithTip) })}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
