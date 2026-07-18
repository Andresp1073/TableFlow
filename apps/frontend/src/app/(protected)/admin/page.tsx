'use client';

import Link from 'next/link';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { StatCard } from '@/components/ui/stat-card';
import { usePlatformStats } from '@/hooks/use-admin';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Users, Key, ShieldCheck, Building2, Activity, Lock, Mail, LogIn, RefreshCw } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error, refetch } = usePlatformStats();

  if (isLoading) return <LoadingState message={t('Loading platform stats...')} />;
  if (error) return <ErrorState message={t('Failed to load platform stats')} onRetry={() => refetch()} />;

  return (
    <AdminPageLayout
      title={t('Platform Dashboard')}
      description={t('Overview of the TableFlow platform')}
    >
      {stats && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              title={t('Total Users')}
              value={stats.totalUsers.toLocaleString()}
              icon={<Users className="h-4 w-4" />}
              description={t('Registered platform users')}
            />
            <StatCard
              title={t('Active Users')}
              value={stats.activeUsers.toLocaleString()}
              icon={<Activity className="h-4 w-4" />}
              description={t('Currently active accounts')}
              trend={{ value: String(stats.activeUsers / Math.max(stats.totalUsers, 1)), positive: true }}
            />
            <StatCard
              title={t('Locked Users')}
              value={stats.lockedUsers.toLocaleString()}
              icon={<Lock className="h-4 w-4" />}
              description={t('Accounts temporarily locked')}
            />
            <StatCard
              title={t('Unverified')}
              value={stats.unverifiedUsers.toLocaleString()}
              icon={<Mail className="h-4 w-4" />}
              description={t('Email not yet verified')}
            />
            <StatCard
              title={t('Recent Logins (24h)')}
              value={stats.recentLogins.toLocaleString()}
              icon={<LogIn className="h-4 w-4" />}
              description={t('Users logged in today')}
            />
            <StatCard
              title={t('Restaurants')}
              value={stats.totalRestaurants.toLocaleString()}
              icon={<Building2 className="h-4 w-4" />}
              description={`${stats.activeRestaurants} ${t('active')}`}
            />
            <StatCard
              title={t('Roles')}
              value={stats.totalRoles.toLocaleString()}
              icon={<Key className="h-4 w-4" />}
              description={t('Defined platform roles')}
            />
            <StatCard
              title={t('Permissions')}
              value={stats.totalPermissions.toLocaleString()}
              icon={<ShieldCheck className="h-4 w-4" />}
              description={t('Granular access controls')}
            />
            <StatCard
              title={t('Active Sessions')}
              value={stats.activeSessions.toLocaleString()}
              icon={<RefreshCw className="h-4 w-4" />}
              description={t('Current refresh tokens')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{t('User Management')}</p>
                <p className="text-xs text-muted-foreground">{t('Create, edit, and manage users')}</p>
              </div>
            </Link>
            <Link
              href="/admin/roles"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <Key className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{t('Role Management')}</p>
                <p className="text-xs text-muted-foreground">{t('Define roles and permissions')}</p>
              </div>
            </Link>
            <Link
              href="/admin/permissions"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{t('Permissions Viewer')}</p>
                <p className="text-xs text-muted-foreground">{t('Browse all permissions')}</p>
              </div>
            </Link>
            <Link
              href="/admin/audit"
              className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{t('Audit Log')}</p>
                <p className="text-xs text-muted-foreground">{t('Review platform activity')}</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
