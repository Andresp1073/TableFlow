'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Users, UserPlus, UserCheck, Award, Cake, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import Link from 'next/link';
import type { CustomerDashboardData } from '@/lib/customer-types';

interface CustomerDashboardContentProps {
  data?: CustomerDashboardData;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onRefresh?: () => void;
}

function StatCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string | number; href?: string }) {
  const content = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export function CustomerDashboardContent({ data, isLoading, isError, error, onRetry, onRefresh }: CustomerDashboardContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium mb-2">Failed to load customer dashboard</p>
        <p className="text-sm text-muted-foreground mb-4">{error?.message ?? 'An unexpected error occurred'}</p>
        {onRetry && <Button onClick={onRetry}>Retry</Button>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customer Dashboard</h1>
          <p className="text-sm text-muted-foreground">Customer relationship and loyalty overview</p>
        </div>
        {onRefresh && (
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh dashboard">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Customers" value={data.totalCustomers} href="/customers" />
        <StatCard icon={<UserPlus className="h-5 w-5" />} label="New (30 days)" value={data.newCustomers} />
        <StatCard icon={<UserCheck className="h-5 w-5" />} label="Active" value={data.activeCustomers} />
        <StatCard icon={<Award className="h-5 w-5" />} label="VIP" value={data.vipCustomers} />
        <StatCard icon={<Cake className="h-5 w-5" />} label="Birthdays This Month" value={data.birthdayCount} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg Visits/Customer" value={data.averageVisitsPerCustomer} />
        <StatCard icon={<Calendar className="h-5 w-5" />} label="Total Visits" value={data.totalVisits} />
        <StatCard icon={<UserPlus className="h-5 w-5" />} label="Growth Rate" value={`${data.customerGrowth}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardWidget title="Recent Registrations" icon={<UserPlus className="h-4 w-4" />}>
          <div className="space-y-3">
            {data.recentRegistrations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent registrations</p>
            ) : (
              data.recentRegistrations.slice(0, 8).map((r) => (
                <Link key={r.id} href={`/customers/${r.id}`} className="flex items-center justify-between py-1.5 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{r.firstName} {r.lastName}</p>
                    <p className="text-xs text-muted-foreground">{r.email ?? r.phone ?? 'No contact'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                </Link>
              ))
            )}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Birthdays This Month" icon={<Cake className="h-4 w-4" />}>
          <div className="space-y-3">
            {data.birthdays.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No birthdays this month</p>
            ) : (
              data.birthdays.map((b) => (
                <Link key={b.id} href={`/customers/${b.id}`} className="flex items-center justify-between py-1.5 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{b.firstName} {b.lastName}</p>
                    <p className="text-xs text-muted-foreground">{b.email ?? 'No email'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(b.birthDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </Link>
              ))
            )}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}
