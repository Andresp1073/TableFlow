import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

function ErrorState({
  title = t('Something went wrong'),
  message = t('An unexpected error occurred. Please try again.'),
  onRetry,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
      role="alert"
      {...props}
    >
      <AlertTriangle className="h-8 w-8 text-destructive mb-4" aria-hidden="true" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          {t('Try again')}
        </Button>
      )}
    </div>
  );
}

export { ErrorState };
