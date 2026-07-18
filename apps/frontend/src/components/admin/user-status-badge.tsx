import { cn } from '@/lib/cn';
import { getUserStatus, USER_STATUS_CONFIG, type AdminUser } from '@/lib/admin-types';

interface UserStatusBadgeProps {
  user: AdminUser;
  className?: string;
}

export function UserStatusBadge({ user, className }: UserStatusBadgeProps) {
  const status = getUserStatus(user);
  const config = USER_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.class,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
