import { ChevronRight, Slash } from 'lucide-react';
import { cn } from '@/lib/cn';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: 'chevron' | 'slash';
}

function Breadcrumb({ items, separator = 'chevron', className, ...props }: BreadcrumbProps) {
  const SeparatorIcon = separator === 'slash' ? Slash : ChevronRight;

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4', className)} {...props}>
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && <SeparatorIcon className="h-3.5 w-3.5" aria-hidden="true" />}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(
                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumb };
export type { BreadcrumbItem, BreadcrumbProps };
