'use client';
import { t } from '@/lib/i18n';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { useRoles, useDeleteRole } from '@/hooks/use-admin';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Plus, Eye, Trash2, Key } from 'lucide-react';
import type { AdminRole } from '@/lib/admin-types';

export default function AdminRolesPage() {
  const router = useRouter();
  const { data: roles, isLoading, error, refetch } = useRoles();
  const deleteMutation = useDeleteRole();

  const handleDelete = async (role: AdminRole) => {
    if (role.isSystem) {
      alert(t("System roles cannot be deleted."));
      return;
    }
    if (!confirm(t('Delete role "{roleName}"? This action cannot be undone.', { roleName: role.name }))) return;
    await deleteMutation.mutateAsync(role.id);
  };

  return (
    <AdminPageLayout
      title={t("Role Management")}
      description={t("Define platform roles and their permissions")}
      action={
        <Link href="/admin/roles/new">
          <Button><Plus className="h-4 w-4 mr-1" />{t("Create Role")}</Button>
        </Link>
      }
    >
      <Breadcrumb
        items={[
          { label: t('Admin'), href: '/admin' },
          { label: t('Roles') },
        ]}
      />

      {isLoading ? (
        <LoadingState message={t("Loading roles...")} />
      ) : error ? (
        <ErrorState message={t("Failed to load roles")} onRetry={() => refetch()} />
      ) : !roles || roles.length === 0 ? (
        <EmptyState
          icon={<Key className="h-8 w-8" />}
          title={t("No roles defined")}
          description={t("Create your first role to get started.")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-lg border p-4 space-y-3 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{role.name}</h3>
                    {role.isSystem && (
                      <Badge variant="default" className="text-[10px]">{t("System")}</Badge>
                    )}
                    {role.isDefault && (
                      <Badge variant="secondary" className="text-[10px]">{t("Default")}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{role.code}</p>
                </div>
              </div>
              {role.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{role.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{t('{count} users', { count: role._count?.userRoles ?? 0 })}</span>
                <span>{t('{count} permissions', { count: role._count?.rolePermissions ?? 0 })}</span>
                {role.color && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                    {role.color}
                  </span>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/roles/${role.id}`)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> {t('View')}
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(role)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1 text-red-500" /> {t('Delete')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageLayout>
  );
}
