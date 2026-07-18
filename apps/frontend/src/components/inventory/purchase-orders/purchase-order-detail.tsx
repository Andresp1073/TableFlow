'use client';
import { t } from '@/lib/i18n';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/inventory/shared/status-badge';
import type { PurchaseOrderDetail } from '@/lib/inventory-types';
import { formatCurrency } from '@/lib/inventory-types';

interface PurchaseOrderDetailViewProps {
  data?: PurchaseOrderDetail;
  isLoading: boolean;
  isError: boolean;
  onSubmit: () => void;
  onApprove: () => void;
  onReceive: () => void;
  onCancel: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function PurchaseOrderDetailView({ data, isLoading, isError, onSubmit, onApprove, onReceive, onCancel }: PurchaseOrderDetailViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-4 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground">Failed to load purchase order</p>
        <Button variant="outline" size="sm" className="mt-4" asChild><Link href="/inventory/purchase-orders">Go Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild><Link href="/inventory/purchase-orders"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Order #{data.id.slice(-8)}</h1>
            <StatusBadge status={data.status} />
            {data.isFullyReceived && data.status === 'Received' && <Badge variant="success">Fully Received</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{data.supplierName}</p>
        </div>
        <div className="flex gap-2">
          {data.status === 'Draft' && <Button onClick={onSubmit}>Submit</Button>}
          {data.status === 'Submitted' && <Button onClick={onApprove}>Approve</Button>}
          {(data.status === 'Approved' || data.status === 'Submitted') && (
            <Button variant="success" onClick={onReceive}>Receive</Button>
          )}
          {data.canTransitionTo.includes('Cancelled') && (
            <Button variant="danger" onClick={onCancel}>Cancel</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label={t("Supplier")} value={data.supplierName} />
            <DetailRow label={t("Status")} value={<StatusBadge status={data.status} />} />
            <DetailRow label={t("Total Amount")} value={formatCurrency(data.totalAmount)} />
            <DetailRow label={t("Items")} value={`${data.receivedCount}/${data.itemCount} received`} />
            <DetailRow label={t("Created By")} value={data.createdBy} />
            <DetailRow label={t("Approved By")} value={data.approvedBy ?? '—'} />
            <DetailRow label={t("Ordered At")} value={data.orderedAt ? new Date(data.orderedAt).toLocaleString() : '—'} />
            <DetailRow label={t("Expected Delivery")} value={data.expectedDeliveryAt ? new Date(data.expectedDeliveryAt).toLocaleDateString() : '—'} />
            {data.receivedAt && <DetailRow label={t("Received At")} value={new Date(data.receivedAt).toLocaleString()} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{data.notes || 'No notes'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items ({data.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 font-medium">Product</th>
                <th className="text-right py-2 font-medium">Quantity</th>
                <th className="text-right py-2 font-medium">Unit Cost</th>
                <th className="text-right py-2 font-medium">Total</th>
                <th className="text-right py-2 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{item.ingredientName}</td>
                  <td className="text-right py-2">{item.quantity} {item.unit}</td>
                  <td className="text-right py-2">{formatCurrency(item.unitCost)}</td>
                  <td className="text-right py-2">{formatCurrency(item.totalCost)}</td>
                  <td className="text-right py-2">
                    <Badge variant={item.receivedQuantity >= item.quantity ? 'success' : 'warning'}>
                      {item.receivedQuantity}/{item.quantity}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-medium border-t">
                <td className="py-2" colSpan={3}>Total</td>
                <td className="text-right py-2">{formatCurrency(data.totalAmount)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
