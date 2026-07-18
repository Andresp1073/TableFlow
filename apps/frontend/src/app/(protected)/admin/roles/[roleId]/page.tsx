'use client';

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
  const roleId = params.roleId as string;
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

  if (isLoading) return <LoadingState message="Loading role..." />;
  if (error) return <ErrorState message="Failed to load role" onRetry={() => refetch()} />;
  if (!role) return <ErrorState message="Role not found" />;

  return (
    <AdminPageLayout title={role.name} description={`Code: ${role.code}`}>
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Roles', href: '/admin/roles' },
          { label: role.name },
        ]}
      />

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Role Details</h2>
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : 'Edit'}
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
                <span className="text-muted-foreground">Code</span>
                <p className="font-mono">{role.code}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p><Badge variant={role.status === 'active' ? 'default' : 'secondary'}>{role.status}</Badge></p>
              </div>
              <div>
                <span className="text-muted-foreground">Priority</span>
                <p>{role.priority}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Users</span>
                <p>{role._count?.userRoles ?? 0}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Permissions</span>
                <p>{role._count?.rolePermissions ?? 0}</p>
              </div>
              {role.description && (
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Description</span>
                  <p>{role.description}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Permissions</h2>
            {replacePermissionsMutation.isPending && (
              <span className="text-sm text-muted-foreground">Saving...</span>
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
            <LoadingState message="Loading permissions..." />
          )}
        </Card>
      </div>
    </AdminPageLayout>
  );
}
