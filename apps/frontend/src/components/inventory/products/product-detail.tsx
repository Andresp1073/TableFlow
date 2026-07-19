'use client';
import { t } from '@/lib/i18n';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, Archive, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { ProductDetail } from '@/lib/inventory-types';
import { formatCurrency } from '@/lib/inventory-types';

interface ProductDetailViewProps {
  data?: ProductDetail;
  isLoading: boolean;
  isError: boolean;
  onArchive: () => void;
  onRestore: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export function ProductDetailView({ data, isLoading, isError, onArchive, onRestore }: ProductDetailViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground">{t('Failed to load product')}</p>
        <Button variant="outline" size="sm" className="mt-4" asChild><Link href="/inventory/products">{t('Go Back')}</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild><Link href="/inventory/products"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{data.name}</h1>
          <p className="text-sm text-muted-foreground">SKU: {data.sku ?? 'N/A'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href={`/inventory/products/${data.id}/edit`}>{t('Edit')}</Link></Button>
          {data.isActive ? (
            <Button variant="danger" onClick={onArchive}><Archive className="h-4 w-4 mr-1" />{t('Archive')}</Button>
          ) : (
            <Button variant="outline" onClick={onRestore}><RotateCcw className="h-4 w-4 mr-1" />{t('Restore')}</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>          <CardTitle className="text-base">{t('Details')}</CardTitle></CardHeader>
          <CardContent>
            <DetailRow label={t("Category")} value={<Badge variant="secondary">{data.category}</Badge>} />
            <DetailRow label={t("Unit")} value={data.unit} />
            <DetailRow label={t('Cost per Unit')} value={formatCurrency(data.costPerUnit)} />
            <DetailRow label={t('Current Stock')} value={<span className={data.currentStock <= 10 ? 'text-destructive' : ''}>{data.currentStock} {data.unit}</span>} />
            <DetailRow label={t('Status')} value={<Badge variant={data.isActive ? 'success' : 'secondary'}>{data.isActive ? t('Active') : t('Archived')}</Badge>} />
            <DetailRow label={t('Perishable')} value={data.perishable ? <Badge variant="warning">{t('Yes')}</Badge> : t('No')} />
            <DetailRow label={t('Shelf Life')} value={data.shelfLifeDays ? `${data.shelfLifeDays} ${t('days')}` : t('N/A')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>          <CardTitle className="text-base">{t('Stock Batches ({count})', { count: data.stockItems.length })}</CardTitle></CardHeader>
          <CardContent>
            {data.stockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No stock batches recorded')}</p>
            ) : (
              <div className="space-y-2">
                {data.stockItems.map((si) => (
                  <div key={si.id} className="text-sm border rounded-md p-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{si.quantity} {si.unit}</span>
                      <span className="text-muted-foreground">{si.location ?? t('No location')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                      <span>{t('Batch:')} {si.batchCode ?? t('N/A')}</span>
                      <span>{si.expiresAt ? `${t('Exp:')} ${new Date(si.expiresAt).toLocaleDateString()}` : t('No expiry')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('Cost:')} {formatCurrency(si.costAtReceipt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data.storageInstructions && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t('Storage Instructions')}</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{data.storageInstructions}</p></CardContent>
        </Card>
      )}
    </div>
  );
}
