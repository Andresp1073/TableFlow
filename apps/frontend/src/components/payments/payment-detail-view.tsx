import type { PaymentTransaction } from '@/lib/payment-types';
import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS,
  METHOD_TYPE_LABELS,
  formatCurrency,
} from '@/lib/payment-types';
import { t } from '@/lib/i18n';
import { PaymentStatusBadge } from '@/components/payments/payment-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CreditCard,
  Hash,
  DollarSign,
  Building2,
  Calendar,
  Clock,
  FileText,
  Receipt,
  RefreshCw,
  AlertCircle,
  Fingerprint,
  Ban,
  CheckCircle2,
} from 'lucide-react';

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

export function PaymentDetailView({ payment }: { payment: PaymentTransaction }) {
  const methodLabel = t(METHOD_TYPE_LABELS[payment.methodType] ?? payment.methodType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {t('Payment Transaction')}

          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="h-2 w-2 rounded-full inline-block"
              style={{ backgroundColor: TRANSACTION_STATUS_COLORS[payment.status] }}
              aria-hidden="true"
            />
            <span className="text-sm text-muted-foreground">
              {t(TRANSACTION_STATUS_LABELS[payment.status])}
            </span>
          </div>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('Payment Information')}

            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<DollarSign className="h-4 w-4" />} label={t('Amount')} value={formatCurrency(payment.amount)} />
            <DetailRow icon={<CheckCircle2 className="h-4 w-4" />} label={t('Captured Amount')} value={payment.capturedAmount != null ? formatCurrency(payment.capturedAmount) : '—'} />
            <DetailRow icon={<RefreshCw className="h-4 w-4" />} label={t('Refunded Amount')} value={payment.refundedAmount > 0 ? formatCurrency(payment.refundedAmount) : '$0.00'} />
            <DetailRow icon={<Receipt className="h-4 w-4" />} label={t('Method')} value={methodLabel} />
            <DetailRow icon={<CreditCard className="h-4 w-4" />} label={t('Provider')} value={payment.providerId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              {t('Transaction Details')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<Hash className="h-4 w-4" />} label={t('Transaction ID')} value={payment.id} />
            <DetailRow icon={<FileText className="h-4 w-4" />} label={t('Intent ID')} value={payment.intentId} />
            <DetailRow icon={<Fingerprint className="h-4 w-4" />} label={t('Provider Reference')} value={payment.providerReference} />
            <DetailRow icon={<Ban className="h-4 w-4" />} label={t('Authorization Code')} value={payment.authorizationCode} />
            <DetailRow icon={<Building2 className="h-4 w-4" />} label={t('Currency')} value={payment.currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('Timeline')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow icon={<Clock className="h-4 w-4" />} label={t('Created')} value={new Date(payment.createdAt).toLocaleString()} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label={t('Updated')} value={new Date(payment.updatedAt).toLocaleString()} />
            {payment.authorizedAt && (
              <DetailRow icon={<CheckCircle2 className="h-4 w-4" />} label={t('Authorized At')} value={new Date(payment.authorizedAt).toLocaleString()} />
            )}
            {payment.capturedAt && (
              <DetailRow icon={<CheckCircle2 className="h-4 w-4" />} label={t('Captured At')} value={new Date(payment.capturedAt).toLocaleString()} />
            )}
          </CardContent>
        </Card>

        {payment.errorMessage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t('Error Information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow icon={<AlertCircle className="h-4 w-4" />} label={t('Error')} value={payment.errorMessage} />
            </CardContent>
          </Card>
        )}

        {payment.refunds.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                {t('Refund History ({count})', { count: payment.refunds.length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payment.refunds.map((refund) => (
                  <div key={refund.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(refund.amount)}</p>
                      <p className="text-xs text-muted-foreground">{refund.type === 'full' ? t('Full Refund') : t('Partial Refund')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(refund.createdAt).toLocaleDateString()}</p>
                      {refund.reason && <p className="text-xs text-muted-foreground">{refund.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
