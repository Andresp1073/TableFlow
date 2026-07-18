'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import {
  CalendarPlus,
  DoorOpen,
  Table2,
  ChefHat,
  Package,
  Users,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const ACTIONS = [
  { label: 'Create Reservation', href: '/reservations/new', icon: CalendarPlus, color: 'text-blue-600' },
  { label: 'Open Table', href: '/tables', icon: DoorOpen, color: 'text-emerald-600' },
  { label: 'Manage Tables', href: '/tables', icon: Table2, color: 'text-violet-600' },
  { label: 'View Kitchen', href: '/kitchen', icon: ChefHat, color: 'text-orange-600' },
  { label: 'View Inventory', href: '/inventory', icon: Package, color: 'text-amber-600' },
  { label: 'Manage Customers', href: '/customers', icon: Users, color: 'text-cyan-600' },
] as const;

function QuickActions() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-1 py-3 text-xs"
                onClick={() => router.push(action.href)}
              >
                <Icon className={cn('h-5 w-5', action.color)} />
                <span className="font-normal">{action.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { QuickActions };
