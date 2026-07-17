'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  sticky?: boolean;
}

const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ leftSlot, centerSlot, rightSlot, sticky = true, className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6',
          sticky && 'sticky top-0 z-30',
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-2 flex-1">{leftSlot}</div>
        {centerSlot && (
          <div className="hidden md:flex items-center gap-2">{centerSlot}</div>
        )}
        <div className="flex items-center gap-2 justify-end">{rightSlot}</div>
      </header>
    );
  },
);
Header.displayName = 'Header';

export { Header };
export type { HeaderProps };
