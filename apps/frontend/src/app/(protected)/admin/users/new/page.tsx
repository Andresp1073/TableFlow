'use client';

import { useRouter } from 'next/navigation';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { UserForm } from '@/components/admin/user-form';
import { useCreateUser, useRoles } from '@/hooks/use-admin';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import type { CreateUserDto, UpdateUserDto } from '@/lib/admin-types';

export default function NewUserPage() {
  const router = useRouter();
  const { data: roles, isLoading, error } = useRoles();
  const createMutation = useCreateUser();

  const handleSubmit = async (data: CreateUserDto | UpdateUserDto) => {
    try {
      await createMutation.mutateAsync(data as CreateUserDto);
      router.push('/admin/users');
    } catch {
      // Error handled by query client
    }
  };

  if (isLoading) return <LoadingState message="Loading roles..." />;
  if (error) return <ErrorState message="Failed to load roles" />;

  return (
    <AdminPageLayout
      title="Create User"
      description="Add a new platform user"
    >
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: 'New' },
        ]}
      />
      <UserForm
        roles={roles ?? []}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        mode="create"
      />
    </AdminPageLayout>
  );
}
