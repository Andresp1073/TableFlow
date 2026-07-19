'use client';
import { t } from '@/lib/i18n';

import { useState, useMemo } from 'react';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { usePermissionsGroups } from '@/hooks/use-admin';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { cn } from '@/lib/cn';
import { RISK_LEVEL_COLORS } from '@/lib/admin-types';
import { Search } from 'lucide-react';

export default function PermissionsViewerPage() {
  const { data: groups, isLoading, error, refetch } = usePermissionsGroups();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search || !groups) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter(
          (p) =>
            p.code.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.resource.toLowerCase().includes(q) ||
            p.action.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [groups, search]);

  if (isLoading) return <LoadingState message={t("Loading permissions...")} />;
  if (error) return <ErrorState message={t("Failed to load permissions")} onRetry={() => refetch()} />;

  return (
    <AdminPageLayout
      title={t("Permissions Viewer")}
      description={t("Browse all platform permissions")}
    >
      <Breadcrumb
        items={[
          { label: t('Admin'), href: '/admin' },
          { label: t('Permissions') },
        ]}
      />

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("Search permissions...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label={t("Search permissions")}
        />
      </div>

      <div className="space-y-8">
        {(filtered ?? []).map((group) => (
          <div key={group.module}>
            <h2 className="text-lg font-semibold capitalize mb-3">{group.module}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.permissions.map((permission) => (
                <Card key={permission.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{permission.name}</span>
                    <Badge
                      variant="outline"
                      className={cn('text-[10px]', RISK_LEVEL_COLORS[permission.riskLevel])}
                    >
                      {permission.riskLevel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{permission.code}</p>
                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                  <div className="flex gap-2 text-[10px] text-muted-foreground">
                    <span>{t("Resource:")}{permission.resource}</span>
                    <span>{t("Action:")}{permission.action}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {filtered && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("No permissions match your search.")}
          </p>
        )}
      </div>
    </AdminPageLayout>
  );
}
