import { cn } from '@/lib/cn';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/lib/i18n';

interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function LoadingState({ message, size = 'md', className, ...props }: LoadingStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 text-center', className)}
      role="status"
      aria-label={t('Loading')}
      {...props}
    >
      <Spinner size={size} />
      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

export { LoadingState };
