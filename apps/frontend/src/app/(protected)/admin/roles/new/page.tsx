'use client';
import { t } from '@/lib/i18n';

import { useRouter } from 'next/navigation';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { RoleForm } from '@/components/admin/role-form';
import { useCreateRole } from '@/hooks/use-admin';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import type { CreateRoleDto, UpdateRoleDto } from '@/lib/admin-types';

export default function NewRolePage() {
  const router = useRouter();
  const createMutation = useCreateRole();

  const handleSubmit = async (data: CreateRoleDto | UpdateRoleDto) => {
    try {
      await createMutation.mutateAsync(data as CreateRoleDto);
      router.push('/admin/roles');
    } catch {
      // Error handled by query client
    }
  };

  return (
    <AdminPageLayout title={t("Create Role")} description={t("Define a new platform role")}>
      <Breadcrumb
        items={[
          { label: t('Admin'), href: '/admin' },
          { label: t('Roles'), href: '/admin/roles' },
          { label: t('New') },
        ]}
      />
      <RoleForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        mode="create"
      />
    </AdminPageLayout>
  );
}
