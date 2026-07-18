'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Users, Key, ShieldCheck, Building2, FileSearch, Bell, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

const adminNavItems = [
  { label: 'Dashboard', href: '/admin', icon: Shield },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Roles', href: '/admin/roles', icon: Key },
  { label: 'Permissions', href: '/admin/permissions', icon: ShieldCheck },
  { label: 'Restaurants', href: '/admin/restaurants', icon: Building2 },
  { label: 'Audit', href: '/admin/audit', icon: FileSearch },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function AdminPageLayout({ title, description, children, action }: AdminPageLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      {children}
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-card shrink-0 hidden lg:block" aria-label="Admin navigation">
      <div className="p-4 border-b">
        <Link href="/admin" className="flex items-center gap-2 font-semibold text-sm">
          <Shield className="h-4 w-4" />
          Admin Panel
        </Link>
      </div>
      <nav className="p-2 space-y-1" aria-label="Admin sections">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
