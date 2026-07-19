'use client';
import { t } from '@/lib/i18n';

import { User, ChevronDown, ChevronUp } from 'lucide-react';
import type { KitchenTicket } from '@/lib/order-types';
import { TICKET_TRANSITIONS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/order-types';
import { OrderStatusBadge } from './order-status-badge';
import { PreparationTimer } from './preparation-timer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface OrderCardProps {
  ticket: KitchenTicket;
  onStatusChange: (ticketId: string, newStatus: string) => void;
  className?: string;
}

export function OrderCard({ ticket, onStatusChange, className }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const nextTransitions = TICKET_TRANSITIONS[ticket.status] ?? [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'border-l-4 overflow-hidden',
          ticket.status === 'new' && 'border-l-warning',
          ticket.status === 'accepted' && 'border-l-info',
          ticket.status === 'preparing' && 'border-l-info',
          ticket.status === 'ready' && 'border-l-success',
          ticket.status === 'delivered' && 'border-l-muted opacity-70',
          ticket.status === 'cancelled' && 'border-l-destructive opacity-60',
          className,
        )}
        role="article"
        aria-label={`Order ${ticket.orderId} — ${ticket.status}`}
      >
        {/* Priority bar */}
        <div
          className={cn('h-1', PRIORITY_COLORS[ticket.priority])}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold truncate">
                  #{ticket.orderId.slice(0, 8)}
                </h3>
                <OrderStatusBadge status={ticket.status} size="sm" />
                {ticket.priority !== 'normal' && (
                  <span
                    className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-bold uppercase tracking-wider text-white',
                      PRIORITY_COLORS[ticket.priority],
                    )}
                  >
                    {t(PRIORITY_LABELS[ticket.priority])}
                  </span>
                )}
              </div>
            </div>
            <PreparationTimer
              createdAt={ticket.createdAt}
              startedAt={ticket.startedAt}
              status={ticket.status}
              priority={ticket.priority}
            />
          </div>

          {/* Customer / Table info */}
          {(ticket.customerName || ticket.tableId || ticket.customerCount) && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {ticket.customerName && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  {ticket.customerName}
                </span>
              )}
              {ticket.tableId && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-mono text-xs">T{ticket.tableId.slice(0, 4)}</span>
                </span>
              )}
              {ticket.customerCount && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  {ticket.customerCount}
                </span>
              )}
              {ticket.notes.length > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-500" title={ticket.notes.join(', ')}>
                  <span className="text-xs">📝</span>
                  <span className="text-xs">{ticket.notes.length}</span>
                </span>
              )}
            </div>
          )}

          {/* Items */}
          <div className="space-y-1">
            {ticket.items.slice(0, expanded ? undefined : 3).map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between py-0.5 px-1.5 rounded text-sm',
                  item.status === 'completed' && 'opacity-50 line-through',
                )}
              >
                <span className="font-medium">
                  <span className="text-muted-foreground mr-1.5">×{item.quantity}</span>
                  {item.menuItemName}
                </span>
                {item.modifiers.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2 truncate max-w-[120px]">
                    {item.modifiers.join(', ')}
                  </span>
                )}
              </div>
            ))}
            {ticket.items.length > 3 && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground pt-1"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                aria-label={expanded ? t('Show fewer items') : t('Show {count} more items', { count: ticket.items.length - 3 })}
              >
                {expanded ? (
                  <><ChevronUp className="h-3 w-3" /> {t('Show less')}</>
                ) : (
                  <><ChevronDown className="h-3 w-3" /> {t('{count} more items', { count: ticket.items.length - 3 })}</>
                )}
              </button>
            )}
          </div>

          {/* Notes */}
          {ticket.notes.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
              {ticket.notes.map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {nextTransitions.length > 0 && (
          <div className="flex gap-1.5 px-3 pb-3" role="group" aria-label={t('Order actions')}>
            {nextTransitions.map((nextStatus) => (
              <Button
                key={nextStatus}
                size="sm"
                variant={
                  nextStatus === 'cancelled' ? 'danger'
                  : nextStatus === 'ready' ? 'success'
                  : nextStatus === 'accepted' ? 'primary'
                  : nextStatus === 'preparing' ? 'primary'
                  : 'outline'
                }
                className="flex-1 text-xs font-bold h-8"
                onClick={() => onStatusChange(ticket.id, nextStatus)}
                aria-label={nextStatus === 'cancelled' ? t('Cancel') : t('Move to {status}', { status: nextStatus })}
              >
                {nextStatus === 'accepted' && t('Accept')}
                {nextStatus === 'preparing' && t('Start Prep')}
                {nextStatus === 'ready' && t('Mark Ready')}
                {nextStatus === 'delivered' && t('Deliver')}
                {nextStatus === 'cancelled' && t('Cancel')}
              </Button>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
