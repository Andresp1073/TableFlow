'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { UserStatusBadge } from '@/components/admin/user-status-badge';
import { useUser, useRoles, useReplaceUserRoles, useDeactivateUser, useActivateUser, useResetUserPassword } from '@/hooks/use-admin';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Ban, CheckCircle, Key } from 'lucide-react';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params['userId'] as string;
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { data: user, isLoading, error, refetch } = useUser(userId);
  const { data: roles } = useRoles();
  const replaceRolesMutation = useReplaceUserRoles(userId);
  const deactivateMutation = useDeactivateUser();
  const activateMutation = useActivateUser();
  const resetPasswordMutation = useResetUserPassword();

  if (isLoading) return <LoadingState message="Loading user..." />;
  if (error) return <ErrorState message="Failed to load user" onRetry={() => refetch()} />;
  if (!user) return <ErrorState message="User not found" />;

  const handleOpenRoles = () => {
    setSelectedRoles(user.userRoles.map((ur) => ur.roleId));
    setRoleDialogOpen(true);
  };

  const handleSaveRoles = async () => {
    await replaceRolesMutation.mutateAsync(selectedRoles);
    setRoleDialogOpen(false);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) return;
    await resetPasswordMutation.mutateAsync({ userId, newPassword });
    setNewPassword('');
    setPasswordDialogOpen(false);
  };

  return (
    <AdminPageLayout title={`${user.firstName} ${user.lastName}`} description={user.email}>
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Users', href: '/admin/users' },
          { label: `${user.firstName} ${user.lastName}` },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Account Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <UserStatusBadge user={user} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verified</span>
              <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                {user.isVerified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{user.phone ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Login</span>
              <span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failed Attempts</span>
              <span>{user.failedLoginAttempts}</span>
            </div>
            {user.lockReason && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lock Reason</span>
                <span className="text-red-500">{user.lockReason}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {user.isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => deactivateMutation.mutateAsync(userId)}
                disabled={deactivateMutation.isPending}
              >
                <Ban className="h-4 w-4 mr-1" /> Deactivate
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => activateMutation.mutateAsync(userId)}
                disabled={activateMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Activate
              </Button>
            )}
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Key className="h-4 w-4 mr-1" /> Reset Password</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                  <DialogDescription>
                    Set a new password for {user.firstName} {user.lastName}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleResetPassword}
                    disabled={resetPasswordMutation.isPending || newPassword.length < 8}
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Roles</h2>
            <Button variant="outline" size="sm" onClick={handleOpenRoles}>
              <Shield className="h-4 w-4 mr-1" /> Manage
            </Button>
          </div>
          {user.userRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles assigned.</p>
          ) : (
            <div className="space-y-2">
              {user.userRoles.map((ur) => (
                <div key={ur.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{ur.role.name}</p>
                    <p className="text-xs text-muted-foreground">{ur.role.code}</p>
                  </div>
                  <Badge variant={ur.role.isSystem ? 'default' : 'secondary'}>
                    {ur.role.isSystem ? 'System' : 'Custom'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
            <DialogDescription>
              Select the roles for {user.firstName} {user.lastName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {roles?.map((role) => (
              <label
                key={role.id}
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRoles([...selectedRoles, role.id]);
                    } else {
                      setSelectedRoles(selectedRoles.filter((id) => id !== role.id));
                    }
                  }}
                  className="h-4 w-4"
                />
                <div>
                  <p className="text-sm font-medium">{role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.description ?? role.code}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveRoles}
              disabled={replaceRolesMutation.isPending}
            >
              {replaceRolesMutation.isPending ? 'Saving...' : 'Save Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
