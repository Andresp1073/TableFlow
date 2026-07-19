'use client';

import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Reward } from '@/lib/loyalty-types';
import { formatPoints, REWARD_TYPE_OPTIONS } from '@/lib/loyalty-types';

interface RewardHistoryViewProps {
  data?: Reward[];
  isLoading: boolean;
  isError: boolean;
}

export function RewardHistoryView({ data, isLoading, isError }: RewardHistoryViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg font-medium mb-2">{t('Failed to load rewards')}</p>
        <p className="text-sm text-muted-foreground mb-4">{t('An error occurred while loading rewards.')}</p>
        <Link href="/loyalty"><Button variant="outline">{t('Back to Loyalty')}</Button></Link>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Gift className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">{t('No rewards available')}</p>
        <p className="text-sm text-muted-foreground mb-4">{t('Rewards will appear here once configured.')}</p>
        <Link href="/loyalty"><Button variant="outline">{t('Back to Loyalty')}</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((reward) => {
        const typeLabel = t(REWARD_TYPE_OPTIONS.find((o) => o.value === reward.type)?.label ?? reward.type);
        return (
          <Card key={reward.id} className={reward.isCurrentlyAvailable ? '' : 'opacity-60'}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{reward.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                </div>
                <div className="flex items-center gap-2">
                   <Badge variant="secondary">{typeLabel}</Badge>
                   {!reward.isCurrentlyAvailable && <Badge variant="secondary">{t('Unavailable')}</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('Cost')}</span>
                  <p className="font-medium">{formatPoints(reward.costInPoints)} pts</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('Value')}</span>
                  <p className="font-medium">{reward.valueCurrency} {reward.value.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('Valid From')}</span>
                  <p className="font-medium">{new Date(reward.validFrom).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('Valid To')}</span>
                  <p className="font-medium">{reward.validTo ? new Date(reward.validTo).toLocaleDateString() : t('No expiry')}</p>
                </div>
              </div>
              {reward.remainingQuantity !== null && (
                <p className="text-xs text-muted-foreground mt-3">
                  {reward.remainingQuantity} {t('remaining')}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
