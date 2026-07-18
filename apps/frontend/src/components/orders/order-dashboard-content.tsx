'use client';

import { ShoppingCart, Clock, ChefHat, CheckCircle2, DollarSign } from 'lucide-react';
import { ErrorState } from '@/components/ui/error-state';
import { StatCard } from '@/components/ui/stat-card';
import type { OrderDashboard } from '@/lib/sales-types';
import { formatCurrency } from '@/lib/sales-types';

interface OrderDashboardContentProps {
  dashboard: OrderDashboard | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}

export function OrderDashboardContent({
  dashboard,
  isLoading,
  isError,
  error,
  onRetry,
}: OrderDashboardContentProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load order dashboard"
        message={error?.message ?? 'An unexpected error occurred'}
        onRetry={onRetry}
      />
    );
  }

  if (!dashboard) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Orders"
        value={dashboard.active}
        icon={<ChefHat className="h-4 w-4" />}
        description={`${dashboard.submitted} submitted, ${dashboard.inProgress} in progress`}
      />
      <StatCard
        title="Submitted"
        value={dashboard.submitted}
        icon={<Clock className="h-4 w-4" />}
        description="Awaiting preparation"
      />
      <StatCard
        title="In Progress"
        value={dashboard.inProgress}
        icon={<ShoppingCart className="h-4 w-4" />}
        description="Being prepared"
      />
      <StatCard
        title="Ready"
        value={dashboard.ready}
        icon={<CheckCircle2 className="h-4 w-4" />}
        description="Ready for pickup"
      />
      <StatCard
        title="Completed Today"
        value={dashboard.completed}
        icon={<CheckCircle2 className="h-4 w-4" />}
        description={`${dashboard.cancelled} cancelled`}
      />
      <StatCard
        title="Today's Revenue"
        value={formatCurrency(dashboard.todayRevenue)}
        icon={<DollarSign className="h-4 w-4" />}
        description={`${dashboard.total} total orders`}
      />
    </div>
  );
}
