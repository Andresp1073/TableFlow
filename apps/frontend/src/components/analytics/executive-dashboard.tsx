'use client';

import { BarChart3, TrendingUp, CalendarCheck, Table2, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { ReportChart } from '@/components/analytics/report-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExecutiveDashboard } from '@/hooks/use-analytics';
import type { DateRange } from '@/lib/analytics-types';

interface ExecutiveDashboardProps {
  dateRange?: DateRange;
}

export function ExecutiveDashboardContent({ dateRange }: ExecutiveDashboardProps) {
  const { data, isLoading, error, refetch } = useExecutiveDashboard(dateRange);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-destructive">
        <p className="text-sm">Failed to load dashboard data</p>
        <button onClick={() => refetch()} className="text-sm underline mt-2">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title={data?.revenue.label ?? 'Revenue'}
          value={data?.revenue.value ?? '$0'}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={data?.revenue.trend}
          loading={isLoading}
        />
        <StatCard
          title={data?.orders.label ?? 'Orders'}
          value={data?.orders.value ?? 0}
          icon={<ShoppingCart className="h-4 w-4" />}
          trend={data?.orders.trend}
          loading={isLoading}
        />
        <StatCard
          title={data?.reservations.label ?? 'Reservations'}
          value={data?.reservations.value ?? 0}
          icon={<CalendarCheck className="h-4 w-4" />}
          trend={data?.reservations.trend}
          loading={isLoading}
        />
        <StatCard
          title={data?.occupancy.label ?? 'Occupancy'}
          value={data?.occupancy.value ?? '0%'}
          icon={<Table2 className="h-4 w-4" />}
          trend={data?.occupancy.trend}
          loading={isLoading}
        />
        <StatCard
          title={data?.averageTicket.label ?? 'Avg Ticket'}
          value={data?.averageTicket.value ?? '$0'}
          icon={<DollarSign className="h-4 w-4" />}
          trend={data?.averageTicket.trend}
          loading={isLoading}
        />
        <StatCard
          title={data?.inventoryValue.label ?? 'Inventory'}
          value={data?.inventoryValue.value ?? '$0'}
          icon={<Package className="h-4 w-4" />}
          trend={data?.inventoryValue.trend}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChart
          title="Revenue Trend"
          type="area"
          data={data?.revenueChart ?? []}
          loading={isLoading}
          height={280}
        />
        <ReportChart
          title="Orders by Day"
          type="bar"
          data={data?.ordersByDay ?? []}
          loading={isLoading}
          height={280}
        />
        <ReportChart
          title="Reservation Status"
          type="pie"
          data={data?.reservationStatus ?? []}
          loading={isLoading}
          height={280}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : !data?.topProducts.length ? (
              <p className="text-sm text-muted-foreground">No product data available.</p>
            ) : (
              <div className="space-y-2">
                {data.topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{product.name}</span>
                    <span className="text-muted-foreground">
                      {product.quantity} units — ${product.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : !data?.topCustomers.length ? (
              <p className="text-sm text-muted-foreground">No customer data available.</p>
            ) : (
              <div className="space-y-2">
                {data.topCustomers.map((customer, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{customer.name}</span>
                    <span className="text-muted-foreground">
                      {customer.visits} visits — ${customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !data?.recentActivity.length ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      <span className="font-medium">{activity.userName}</span>
                      {' '}{activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
