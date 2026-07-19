'use client';
import { t } from '@/lib/i18n';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import { DashboardGrid, DashboardGridItem } from '@/components/dashboard/dashboard-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, TrendingDown, DollarSign, ClipboardList, ArrowUpDown } from 'lucide-react';
import type { InventoryDashboardData } from '@/lib/inventory-types';
import { formatCurrency } from '@/lib/inventory-types';
import { StatusBadge } from '@/components/inventory/shared/status-badge';
import Link from 'next/link';

interface InventoryDashboardContentProps {
  data?: InventoryDashboardData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefresh: () => void;
  onRetry: () => void;
}

function StatCard({ title, value, icon, description, href }: { title: string; value: string | number; icon: React.ReactNode; description?: string; href?: string }) {
  const content = (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export function InventoryDashboardContent({ data, isLoading, isError, error, onRefresh: _onRefresh, onRetry }: InventoryDashboardContentProps) {
  if (isLoading) {
    return (
      <DashboardGrid>
        {Array.from({ length: 7 }).map((_, i) => (
          <DashboardGridItem key={i} colSpan={i < 4 ? 1 : i < 6 ? 2 : 6}>
            <Card><CardHeader className="py-3 px-4"><Skeleton className="h-4 w-24" /></CardHeader><CardContent className="px-4 pb-4"><Skeleton className="h-8 w-16" /></CardContent></Card>
          </DashboardGridItem>
        ))}
      </DashboardGrid>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
        <h3 className="text-sm font-semibold">{t("Failed to load inventory data")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{error?.message}</p>
        <button onClick={onRetry} className="mt-4 text-sm text-primary hover:underline">{t("Retry")}</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <DashboardGrid>
        <DashboardGridItem colSpan={1}>
          <StatCard title={t('Total Products')} value={data.totalProducts} icon={<Package className="h-4 w-4" />} href="/inventory/products" />
        </DashboardGridItem>
        <DashboardGridItem colSpan={1}>
          <StatCard title={t('Inventory Value')} value={formatCurrency(data.totalStockValue)} icon={<DollarSign className="h-4 w-4" />} />
        </DashboardGridItem>
        <DashboardGridItem colSpan={1}>
          <StatCard title={t('Low Stock')} value={data.lowStockCount} icon={<AlertTriangle className="h-4 w-4 text-warning" />} description={t('Items below minimum threshold')} href="/inventory/alerts" />
        </DashboardGridItem>
        <DashboardGridItem colSpan={1}>
          <StatCard title={t('Out of Stock')} value={data.outOfStockCount} icon={<TrendingDown className="h-4 w-4 text-destructive" />} href="/inventory/alerts" />
        </DashboardGridItem>
        <DashboardGridItem colSpan={1}>
          <StatCard title={t('Pending Orders')} value={data.pendingOrderCount} icon={<ClipboardList className="h-4 w-4" />} href="/inventory/purchase-orders" />
        </DashboardGridItem>
        <DashboardGridItem colSpan={1}>
          <StatCard title={t('Categories')} value={data.totalCategories} icon={<Package className="h-4 w-4" />} href="/inventory/categories" />
        </DashboardGridItem>
      </DashboardGrid>

      <DashboardGrid>
        <DashboardGridItem colSpan={3}>
          <DashboardWidget title={t('Low Stock Products')} isEmpty={data.lowStockProducts.length === 0} emptyMessage={t('All inventory levels are healthy')}>
            <div className="space-y-2">
              {data.lowStockProducts.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <Link href={`/inventory/products/${p.id}`} className="hover:underline truncate">{p.name}</Link>
                  <span className="text-muted-foreground shrink-0 ml-2">{p.currentStock} {p.unit}</span>
                </div>
              ))}
              {data.lowStockProducts.length > 8 && (
                <Link href="/inventory/alerts" className="text-sm text-primary hover:underline block mt-2">{t('View all {count} low stock items', { count: data.lowStockProducts.length })}</Link>
              )}
            </div>
          </DashboardWidget>
        </DashboardGridItem>

        <DashboardGridItem colSpan={3}>
          <DashboardWidget title={t('Pending Purchase Orders')} isEmpty={data.pendingOrders.length === 0} emptyMessage={t('No pending orders')}>
            <div className="space-y-2">
              {data.pendingOrders.slice(0, 5).map((po) => (
                <div key={po.id} className="flex items-center justify-between text-sm">
                  <Link href={`/inventory/purchase-orders/${po.id}`} className="hover:underline truncate">{po.supplierName}</Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={po.status} />
                    <span className="text-muted-foreground">{formatCurrency(po.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardWidget>
        </DashboardGridItem>
      </DashboardGrid>

      <DashboardGrid>
        <DashboardGridItem colSpan={3}>
          <DashboardWidget title={t('Recent Movements')} isEmpty={data.recentMovements.length === 0} emptyMessage={t('No recent movements')}>
            <div className="space-y-1">
              {data.recentMovements.slice(0, 10).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2 truncate">
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{m.ingredientName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={m.type === 'Purchase' ? 'success' : m.type === 'Consumption' ? 'danger' : 'secondary'}>{m.type}</Badge>
                    <span className="text-muted-foreground text-xs">{m.quantity} {m.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardWidget>
        </DashboardGridItem>

        <DashboardGridItem colSpan={3}>
          <DashboardWidget title={t('Top Consumed Products')} isEmpty={data.topConsumed.length === 0} emptyMessage={t('No consumption data')}>
            <div className="space-y-2">
              {data.topConsumed.slice(0, 8).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                    <span className="truncate">{p.name}</span>
                  </div>
                   <span className="text-muted-foreground shrink-0">{Math.round(p.quantity)} {t('units')}</span>
                </div>
              ))}
            </div>
          </DashboardWidget>
        </DashboardGridItem>
      </DashboardGrid>
    </div>
  );
}
