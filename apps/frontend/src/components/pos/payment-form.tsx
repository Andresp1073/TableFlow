'use client';

import { useState } from 'react';
import { CreditCard, Banknote, Wallet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/sales-types';
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
  { id: 'credit_card', label: 'Credit Card', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'debit_card', label: 'Debit Card', icon: <CreditCard className="h-5 w-5" /> },
  { id: 'cash', label: 'Cash', icon: <Banknote className="h-5 w-5" /> },
  { id: 'digital_wallet', label: 'Digital Wallet', icon: <Wallet className="h-5 w-5" /> },
  { id: 'contactless', label: 'Contactless', icon: <Smartphone className="h-5 w-5" /> },
];

const PAYMENT_PROVIDERS = [
  { id: 'stripe', label: 'Stripe' },
  { id: 'square', label: 'Square' },
  { id: 'paypal', label: 'PayPal' },
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
            Payment Successful
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-green-600">{formatCurrency(paymentResult.paid)}</div>
            <div className="text-sm text-muted-foreground">Payment received</div>
          </div>
          {paymentResult.tip > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tip</span>
              <span>{formatCurrency(paymentResult.tip)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Transaction ID</span>
            <span className="font-mono text-xs">{paymentResult.paymentTransactionId.slice(0, 12)}</span>
          </div>
          <Button className="w-full mt-4" onClick={onClose}>
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-3">
          <div className="text-3xl font-bold">{formatCurrency(total)}</div>
          <div className="text-sm text-muted-foreground">Total due</div>
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <Button
                key={method.id}
                variant={selectedMethod === method.id ? 'default' : 'outline'}
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
          <Label htmlFor="provider">Provider</Label>
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
          <Label>Tip</Label>
          <div className="flex gap-2">
            {[0, 10, 15, 20].map((pct) => (
              <Button
                key={pct}
                variant={tipPercent === pct ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTipPercent(pct)}
                type="button"
              >
                {pct === 0 ? 'No Tip' : `${pct}%`}
              </Button>
            ))}
          </div>
          {tipPercent > 0 && (
            <div className="text-sm text-muted-foreground">
              Tip: {formatCurrency(tipAmount)} — Total: {formatCurrency(totalWithTip)}
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
            <LoadingState message="Processing..." />
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay {formatCurrency(totalWithTip)}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
