'use client';
import { t } from '@/lib/i18n';

import { useState } from 'react';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Search, RefreshCw, FileSearch, Shield } from 'lucide-react';
import { get } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

interface AuditEntry {
  id: string;
  module: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string | null;
  ipAddress: string | null;
  createdAt: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
}

interface AuditResponse {
  data: AuditEntry[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');

  const queryParams = new URLSearchParams();
  if (page) queryParams.set('page', page.toString());
  if (search) queryParams.set('search', search);
  if (module) queryParams.set('module', module);
  if (action) queryParams.set('action', action);

  const { data, isLoading, error, refetch } = useQuery<AuditResponse>({
    queryKey: ['admin', 'audit', page, search, module, action],
    queryFn: async () => {
      const response = await get<AuditEntry[]>(`/audit?${queryParams.toString()}`);
      return { data: response.data, meta: response.meta as AuditResponse['meta'] };
    },
    staleTime: 15_000,
  });

  const entries = data?.data ?? [];
  const meta = data?.meta;

  return (
    <AdminPageLayout
      title={t("Audit Log")}
      description={t("Review platform activity and security events")}
    >
      <Breadcrumb
        items={[
          { label: t('Admin'), href: '/admin' },
          { label: t('Audit') },
        ]}
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Search audit entries...")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            aria-label={t("Search audit entries")}
          />
        </div>
        <Select value={module} onValueChange={(value) => { setModule(value); setPage(1); }}>
          <SelectTrigger aria-label={t("Filter by module")} className="w-36">
            <SelectValue placeholder={t("All Modules")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("All Modules")}</SelectItem>
            <SelectItem value="auth">{t("Auth")}</SelectItem>
            <SelectItem value="users">{t("Users")}</SelectItem>
            <SelectItem value="roles">{t("Roles")}</SelectItem>
            <SelectItem value="restaurants">{t("Restaurants")}</SelectItem>
            <SelectItem value="reservations">{t("Reservations")}</SelectItem>
            <SelectItem value="orders">{t("Orders")}</SelectItem>
            <SelectItem value="payments">{t("Payments")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={(value) => { setAction(value); setPage(1); }}>
          <SelectTrigger aria-label={t("Filter by action")} className="w-36">
            <SelectValue placeholder={t("All Actions")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("All Actions")}</SelectItem>
            <SelectItem value="create">{t("Create")}</SelectItem>
            <SelectItem value="update">{t("Update")}</SelectItem>
            <SelectItem value="delete">{t("Delete")}</SelectItem>
            <SelectItem value="login">{t("Login")}</SelectItem>
            <SelectItem value="logout">{t("Logout")}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon-sm" onClick={() => refetch()} aria-label={t("Refresh")}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message={t("Loading audit log...")} />
      ) : error ? (
        <ErrorState message={t("Failed to load audit log")} onRetry={() => refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<FileSearch className="h-8 w-8" />}
          title={t("No audit entries")}
          description={t("Audit entries will appear here as platform activity occurs.")}
        />
      ) : (
        <div className="rounded-lg border">
          <table className="w-full" aria-label={t("Audit log entries")}>
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">{t("Timestamp")}</th>
                <th className="text-left p-3 text-sm font-medium">{t("Module")}</th>
                <th className="text-left p-3 text-sm font-medium">{t("Action")}</th>
                <th className="text-left p-3 text-sm font-medium">{t("Entity")}</th>
                <th className="text-left p-3 text-sm font-medium">{t("User")}</th>
                <th className="text-left p-3 text-sm font-medium">{t("IP")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 text-sm">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-sm">
                      <Shield className="h-3 w-3" />
                      {entry.module}
                    </span>
                  </td>
                  <td className="p-3 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      entry.action === 'delete' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' :
                      entry.action === 'create' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground font-mono">
                    {entry.entityType}:{entry.entityId.slice(0, 8)}...
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{entry.performedBy ?? t('System')}</td>
                  <td className="p-3 text-sm text-muted-foreground font-mono">{entry.ipAddress ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} paginationRange={[]} />
        </div>
      )}
    </AdminPageLayout>
  );
}
