import { cn } from '@/lib/cn';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  description?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, trend, description, loading = false, className, ...props }: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn('', className)} {...props}>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)} {...props}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className={cn('text-xs font-medium', trend.positive ? 'text-success' : 'text-destructive')}>
                {trend.value}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className="rounded-md bg-muted p-2 text-muted-foreground" aria-hidden="true">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { StatCard };
