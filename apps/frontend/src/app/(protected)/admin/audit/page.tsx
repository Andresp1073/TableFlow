'use client';

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
      title="Audit Log"
      description="Review platform activity and security events"
    >
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Audit' },
        ]}
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit entries..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            aria-label="Search audit entries"
          />
        </div>
        <Select value={module} onValueChange={(value) => { setModule(value); setPage(1); }}>
          <SelectTrigger aria-label="Filter by module" className="w-36">
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Modules</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="users">Users</SelectItem>
            <SelectItem value="roles">Roles</SelectItem>
            <SelectItem value="restaurants">Restaurants</SelectItem>
            <SelectItem value="reservations">Reservations</SelectItem>
            <SelectItem value="orders">Orders</SelectItem>
            <SelectItem value="payments">Payments</SelectItem>
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={(value) => { setAction(value); setPage(1); }}>
          <SelectTrigger aria-label="Filter by action" className="w-36">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon-sm" onClick={() => refetch()} aria-label="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="Loading audit log..." />
      ) : error ? (
        <ErrorState message="Failed to load audit log" onRetry={() => refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<FileSearch className="h-8 w-8" />}
          title="No audit entries"
          description="Audit entries will appear here as platform activity occurs."
        />
      ) : (
        <div className="rounded-lg border">
          <table className="w-full" aria-label="Audit log entries">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Timestamp</th>
                <th className="text-left p-3 text-sm font-medium">Module</th>
                <th className="text-left p-3 text-sm font-medium">Action</th>
                <th className="text-left p-3 text-sm font-medium">Entity</th>
                <th className="text-left p-3 text-sm font-medium">User</th>
                <th className="text-left p-3 text-sm font-medium">IP</th>
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
                  <td className="p-3 text-sm text-muted-foreground">{entry.performedBy ?? 'System'}</td>
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
