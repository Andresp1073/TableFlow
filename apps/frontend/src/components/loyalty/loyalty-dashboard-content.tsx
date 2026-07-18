'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Award, Gift, TrendingUp, Star, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardWidget } from '@/components/dashboard/dashboard-widget';
import Link from 'next/link';
import type { LoyaltyDashboardData, LoyaltyTier } from '@/lib/loyalty-types';
import { formatPoints, getTierColor } from '@/lib/loyalty-types';

interface LoyaltyDashboardContentProps {
  data?: LoyaltyDashboardData;
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

export function LoyaltyDashboardContent({ data, isLoading, isError, error, onRetry, onRefresh }: LoyaltyDashboardContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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
        <p className="text-lg font-medium mb-2">Failed to load loyalty dashboard</p>
        <p className="text-sm text-muted-foreground mb-4">{error?.message ?? 'An unexpected error occurred'}</p>
        {onRetry && <Button onClick={onRetry}>Retry</Button>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Loyalty Dashboard</h1>
          <p className="text-sm text-muted-foreground">Customer loyalty program overview</p>
        </div>
        {onRefresh && (
          <Button variant="outline" size="icon" onClick={onRefresh} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Enrolled Members" value={data.totalEnrolled} />
        <StatCard icon={<Award className="h-5 w-5" />} label="Active Members" value={data.activeMembers} />
        <StatCard icon={<Star className="h-5 w-5" />} label="Total Points Issued" value={formatPoints(data.totalPointsIssued)} />
        <StatCard icon={<Gift className="h-5 w-5" />} label="Points Redeemed" value={formatPoints(data.totalPointsRedeemed)} />
        <StatCard icon={<Zap className="h-5 w-5" />} label="Current Balance" value={formatPoints(data.totalPointsBalance)} />
        <StatCard icon={<Gift className="h-5 w-5" />} label="Rewards Available" value={data.totalRewardsAvailable} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Total Spent" value={`$${data.totalSpent.toLocaleString()}`} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Avg Spent/Member" value={`$${data.averageSpentPerMember.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardWidget title="Tier Distribution" icon={<Award className="h-4 w-4" />}>
          <div className="space-y-3">
            {Object.entries(data.tierDistribution).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No members enrolled yet</p>
            ) : (
              Object.entries(data.tierDistribution).map(([tier, count]) => {
                const total = data.totalEnrolled;
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={tier} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getTierColor(tier as LoyaltyTier)}>{tier}</Badge>
                      <span className="text-sm text-muted-foreground">{count} members</span>
                    </div>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                );
              })
            )}
          </div>
        </DashboardWidget>

        <DashboardWidget title="Recent Redemptions" icon={<Gift className="h-4 w-4" />}>
          <div className="space-y-3">
            {data.recentRedemptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent redemptions</p>
            ) : (
              data.recentRedemptions.slice(0, 8).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-sm font-medium">{r.rewardName}</p>
                    <p className="text-xs text-muted-foreground">{r.status} &middot; {new Date(r.requestedAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="secondary">{r.pointsCost} pts</Badge>
                </div>
              ))
            )}
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}
