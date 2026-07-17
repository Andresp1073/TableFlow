import { cn } from '@/lib/cn';

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

function Footer({ leftSlot, rightSlot, className, ...props }: FooterProps) {
  return (
    <footer
      className={cn(
        'flex items-center justify-between border-t px-4 lg:px-6 py-3 text-xs text-muted-foreground',
        className,
      )}
      {...props}
    >
      <div>{leftSlot}</div>
      <div>{rightSlot}</div>
    </footer>
  );
}

export { Footer };
