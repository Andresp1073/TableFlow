'use client';

import { useMemo } from 'react';
import type { KitchenTicket } from '@/lib/order-types';
import { TICKET_STATUS_ORDER, TICKET_STATUS_LABELS, ACTIVE_TICKET_STATUSES } from '@/lib/order-types';
import { OrderCard } from './order-card';
import { cn } from '@/lib/cn';
import { AnimatePresence } from 'framer-motion';

interface OrderBoardProps {
  tickets: KitchenTicket[];
  onStatusChange: (ticketId: string, newStatus: string) => void;
  className?: string;
  compact?: boolean;
}

export function OrderBoard({ tickets, onStatusChange, className, compact = false }: OrderBoardProps) {
  const columns = useMemo(() => {
    const statuses = compact
      ? ACTIVE_TICKET_STATUSES
      : TICKET_STATUS_ORDER;

    return statuses.map((status) => ({
      status,
      label: TICKET_STATUS_LABELS[status],
      tickets: tickets.filter((t) => t.status === status),
      count: tickets.filter((t) => t.status === status).length,
    }));
  }, [tickets, compact]);

  const allEmpty = columns.every((col) => col.tickets.length === 0);

  if (allEmpty) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-lg">
        No active orders
      </div>
    );
  }

  return (
    <div
      className={cn('grid gap-4 auto-rows-max', className)}
      style={{
        gridTemplateColumns: `repeat(${columns.length}, minmax(${compact ? '280px' : '300px'}, 1fr))`,
      }}
      role="region"
      aria-label="Order board"
    >
      {columns.map((column) =>
        column.tickets.length === 0 && compact ? null : (
          <div key={column.status} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {column.label}
              </h2>
              {column.count > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-bold text-white',
                    column.status === 'new' && 'bg-warning',
                    column.status === 'ready' && 'bg-success',
                    column.status === 'preparing' && 'bg-info',
                    column.status === 'accepted' && 'bg-info',
                  )}
                  aria-label={`${column.count} orders`}
                >
                  {column.count}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {column.tickets.map((ticket) => (
                  <OrderCard
                    key={ticket.id}
                    ticket={ticket}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
