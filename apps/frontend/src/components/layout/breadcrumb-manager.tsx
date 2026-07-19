'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';
import { getNavItemByHref } from '@/components/navigation/nav-config';
import { useBreadcrumb } from '@/providers/breadcrumb-provider';
import { t } from '@/lib/i18n';

function pathToBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === '/dashboard' || pathname === '/') {
    return [{ label: t('Dashboard'), href: '/dashboard' }];
  }

  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: t('Dashboard'), href: '/dashboard' }];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const navItem = getNavItemByHref(currentPath);
    if (navItem) {
      items.push({ label: t(navItem.label), href: currentPath });
    } else {
      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href: currentPath,
      });
    }
  }

  return items;
}

export function BreadcrumbManager() {
  const pathname = usePathname();
  const { items, setItems } = useBreadcrumb();

  useEffect(() => {
    const breadcrumbs = pathToBreadcrumbs(pathname);
    setItems(breadcrumbs);
  }, [pathname, setItems]);

  if (items.length === 0) return null;

  return <Breadcrumb items={items} />;
}
