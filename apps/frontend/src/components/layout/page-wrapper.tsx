import { cn } from '@/lib/cn';
import { ContentArea } from '@/components/layout/content-area';

interface PageWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

function PageWrapper({
  title,
  description,
  actions,
  breadcrumb,
  maxWidth: _maxWidth = 'lg',
  className,
  children,
  ...props
}: PageWrapperProps) {
  return (
    <ContentArea className={cn('', className)} {...props}>
      {breadcrumb}

      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="space-y-1">
            {title && <h1 className="text-xl font-semibold tracking-tight">{title}</h1>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {children}
    </ContentArea>
  );
}

export { PageWrapper };
