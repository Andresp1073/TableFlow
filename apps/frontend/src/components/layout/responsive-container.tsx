import { cn } from '@/lib/cn';

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article' | 'main';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[90rem]',
  '2xl': 'max-w-[96rem]',
  full: 'max-w-full',
} as const;

function ResponsiveContainer({
  as: Tag = 'div',
  maxWidth = 'lg',
  className,
  children,
  ...props
}: ResponsiveContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        maxWidthClasses[maxWidth],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export { ResponsiveContainer };
