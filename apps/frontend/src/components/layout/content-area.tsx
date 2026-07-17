import { cn } from '@/lib/cn';

interface ContentAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

function ContentArea({ padding = true, className, ...props }: ContentAreaProps) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto',
        padding && 'px-4 lg:px-6 py-4 lg:py-6',
        className,
      )}
      {...props}
    />
  );
}

export { ContentArea };
