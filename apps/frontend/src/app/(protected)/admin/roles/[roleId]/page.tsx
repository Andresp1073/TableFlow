'use client';

import { t } from '@/lib/i18n';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { RoleForm } from '@/components/admin/role-form';
import { PermissionMatrix } from '@/components/admin/permission-matrix';
import { useRole, useRolePermissions, usePermissionsGroups, useUpdateRole, useReplaceRolePermissions } from '@/hooks/use-admin';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function RoleDetailPage() {
  const params = useParams();
  const roleId = params['roleId'] as string;
  const [editing, setEditing] = useState(false);

  const { data: role, isLoading, error, refetch } = useRole(roleId);
  const { data: permissions } = useRolePermissions(roleId);
  const { data: groups } = usePermissionsGroups();
  const updateMutation = useUpdateRole(roleId);
  const replacePermissionsMutation = useReplaceRolePermissions(roleId);

  const selectedIds = permissions?.map((p) => p.id) ?? [];

  const handleToggle = (permissionId: string) => {
    const updated = selectedIds.includes(permissionId)
      ? selectedIds.filter((id) => id !== permissionId)
      : [...selectedIds, permissionId];
    replacePermissionsMutation.mutate(updated);
  };

  if (isLoading) return <LoadingState message={t("Loading role...")} />;
  if (error) return <ErrorState message={t("Failed to load role")} onRetry={() => refetch()} />;
  if (!role) return <ErrorState message={t("Role not found")} />;

  return (
    <AdminPageLayout title={role.name} description={t("Code: {code}", { code: role.code })}>
      <Breadcrumb
        items={[
          { label: t('Admin'), href: '/admin' },
          { label: t('Roles'), href: '/admin/roles' },
          { label: role.name },
        ]}
      />

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t("Role Details")}</h2>
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? t('Cancel') : t('Edit')}
            </Button>
          </div>

          {editing ? (
            <RoleForm
              initialData={role}
              onSubmit={(data) => {
                updateMutation.mutateAsync(data as Parameters<typeof updateMutation.mutate>[0]);
                setEditing(false);
              }}
              isSubmitting={updateMutation.isPending}
              mode="edit"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-muted-foreground">{t("Code")}</span>
                <p className="font-mono">{role.code}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("Status")}</span>
                <p><Badge variant={role.status === 'active' ? 'default' : 'secondary'}>{role.status}</Badge></p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("Priority")}</span>
                <p>{role.priority}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("Users")}</span>
                <p>{role._count?.userRoles ?? 0}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("Permissions")}</span>
                <p>{role._count?.rolePermissions ?? 0}</p>
              </div>
              {role.description && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">{t("Description")}</span>
                  <p>{role.description}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t("Permissions")}</h2>
            {replacePermissionsMutation.isPending && (
              <span className="text-sm text-muted-foreground">{t("Saving...")}</span>
            )}
          </div>
          {groups ? (
            <PermissionMatrix
              groups={groups}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              readOnly={role.isSystem}
            />
          ) : (
            <LoadingState message={t("Loading permissions...")} />
          )}
        </Card>
      </div>
    </AdminPageLayout>
  );
}
