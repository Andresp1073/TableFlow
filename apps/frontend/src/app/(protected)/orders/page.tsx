'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useOrders, useOrderDashboard } from '@/hooks/use-orders';
import { OrderList } from '@/components/orders/order-list';
import { OrderDashboardContent } from '@/components/orders/order-dashboard-content';

export default function OrdersPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useOrders(restaurantId, statusFilter);

  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useOrderDashboard(restaurantId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track customer orders
          </p>
        </div>
        <Button onClick={() => router.push('/orders/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      <OrderDashboardContent
        dashboard={dashboard}
        isLoading={isDashboardLoading}
        isError={isDashboardError}
        error={dashboardError}
        onRetry={() => refetchDashboard()}
      />

      <Tabs defaultValue="all" onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="ready">Ready</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value={statusFilter ?? 'all'} className="mt-4">
          <OrderList
            orders={orders}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={() => refetch()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
