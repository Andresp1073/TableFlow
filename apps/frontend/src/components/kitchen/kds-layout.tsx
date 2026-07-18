'use client';

import { cn } from '@/lib/cn';

interface KdsLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function KdsLayout({ children, className }: KdsLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground',
        'antialiased',
        className,
      )}
    >
      {children}
    </div>
  );
}
