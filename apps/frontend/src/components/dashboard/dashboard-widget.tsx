'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DashboardWidgetProps {
  title: string;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  onRefresh?: () => void;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

function WidgetSkeleton() {
  return (
    <div className="space-y-3 p-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

function DashboardWidget({
  title,
  isLoading = false,
  isError = false,
  isEmpty = false,
  error = null,
  emptyMessage = 'No data available',
  onRefresh,
  onRetry,
  action,
  className,
  children,
}: DashboardWidgetProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {action}
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7"
              onClick={onRefresh}
              disabled={isLoading}
              aria-label={`Refresh ${title}`}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-4 pt-0">
        {isLoading ? (
          <WidgetSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-xs text-muted-foreground mb-2">
              {error?.message ?? 'Failed to load data'}
            </p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export { DashboardWidget };
