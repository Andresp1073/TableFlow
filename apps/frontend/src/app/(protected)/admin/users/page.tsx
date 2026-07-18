'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { UserStatusBadge } from '@/components/admin/user-status-badge';
import { useUsers, useDeactivateUser, useActivateUser } from '@/hooks/use-admin';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Plus, Search, Eye, Ban, CheckCircle, RefreshCw, Users } from 'lucide-react';
import type { AdminUser } from '@/lib/admin-types';
import { t } from '@/lib/i18n';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, error, refetch } = useUsers({ page, limit: 20, search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined });
  const deactivateMutation = useDeactivateUser();
  const activateMutation = useActivateUser();

  const users = data?.data ?? [];
  const meta = data?.meta;

  const handleDeactivate = async (userId: string) => {
    if (confirm(t('Deactivate this user? They will be unable to log in.'))) {
      await deactivateMutation.mutateAsync(userId);
    }
  };

  const handleActivate = async (userId: string) => {
    await activateMutation.mutateAsync(userId);
  };

  return (
    <AdminPageLayout
      title={t('User Management')}
      description={t('Manage platform users and their roles')}
      action={
        <Link href="/admin/users/new" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-9 px-4 text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" />{t('Create User')}
        </Link>
      }
    >
      <Breadcrumb
        items={[
          { label: t('Admin'), href: '/admin' },
          { label: t('Users') },
        ]}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('Search users...')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            aria-label={t('Search users')}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => { setStatusFilter(value); setPage(1); }}
        >
          <SelectTrigger aria-label={t('Filter by status')} className="w-36">
            <SelectValue placeholder={t('All Status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All Status')}</SelectItem>
            <SelectItem value="active">{t('Active')}</SelectItem>
            <SelectItem value="inactive">{t('Inactive')}</SelectItem>
            <SelectItem value="locked">{t('Locked')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon-sm" onClick={() => refetch()} aria-label={t('Refresh')}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message={t('Loading users...')} />
      ) : error ? (
        <ErrorState message={t('Failed to load users')} onRetry={() => refetch()} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={t('No users found')}
          description={search || statusFilter !== 'all' ? t('Try adjusting your filters.') : t('Create your first user to get started.')}
        />
      ) : (
        <div className="rounded-lg border">
          <table className="w-full" aria-label="Users list">
            <caption className="sr-only">Users list</caption>
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">{t('Name')}</th>
                <th className="text-left p-3 text-sm font-medium">{t('Email')}</th>
                <th className="text-left p-3 text-sm font-medium">{t('Status')}</th>
                <th className="text-left p-3 text-sm font-medium">{t('Roles')}</th>
                <th className="text-left p-3 text-sm font-medium">{t('Last Login')}</th>
                <th className="text-right p-3 text-sm font-medium">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: AdminUser) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {user.firstName} {user.lastName}
                    </Link>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">{user.email}</td>
                  <td className="p-3"><UserStatusBadge user={user} /></td>
                  <td className="p-3 text-sm">
                    {user.userRoles.map((ur) => ur.role.name).join(', ') || '-'}
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : t('Never')}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" asChild aria-label={t('View user')}>
                        <Link href={`/admin/users/${user.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {user.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeactivate(user.id)}
                          disabled={deactivateMutation.isPending}
                          aria-label={t('Deactivate user')}
                        >
                          <Ban className="h-4 w-4 text-amber-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleActivate(user.id)}
                          disabled={activateMutation.isPending}
                          aria-label={t('Activate user')}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </AdminPageLayout>
  );
}
