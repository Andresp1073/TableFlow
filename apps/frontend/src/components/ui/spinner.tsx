import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  return (
    <div
      className={cn('animate-spin text-muted-foreground', sizeMap[size], className)}
      role="status"
      aria-label={t('Loading')}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-25"
        />
        <path
          d="M12 2a10 10 0 019.95 9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className="opacity-75"
        />
      </svg>
    </div>
  );
}

function SpinnerPage({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex h-[50vh] items-center justify-center', className)} {...props}>
      <Spinner size="xl" />
    </div>
  );
}

export { Spinner, SpinnerPage };
