'use client';
import { t } from '@/lib/i18n';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import type { SLAStatus, KitchenPriority } from '@/lib/order-types';
import { SLA_TIME_LIMITS_MS, PRIORITY_LABELS } from '@/lib/order-types';
import { cn } from '@/lib/cn';

interface PreparationTimerProps {
  createdAt: string;
  startedAt?: string | null;
  status: string;
  priority: KitchenPriority;
  className?: string;
}

function getSLAStatus(elapsedMs: number, limitMs: number): SLAStatus {
  const ratio = elapsedMs / limitMs;
  if (ratio >= 1) return 'delayed';
  if (ratio >= 0.8) return 'warning';
  return 'on_track';
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PreparationTimer({
  createdAt,
  startedAt,
  status,
  priority,
  className,
}: PreparationTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (status === 'delivered' || status === 'cancelled') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const startTime = startedAt ? new Date(startedAt).getTime() : new Date(createdAt).getTime();
  const elapsedMs = now - startTime;
  const limitMs = SLA_TIME_LIMITS_MS[priority] ?? 600_000;
  const slaStatus = getSLAStatus(elapsedMs, limitMs);
  const display = status === 'delivered' || status === 'cancelled' ? '—' : formatElapsed(elapsedMs);

  const slaColors: Record<SLAStatus, string> = {
    on_track: 'text-blue-500 dark:text-blue-400',
    warning: 'text-amber-500 dark:text-amber-400',
    delayed: 'text-red-500 dark:text-red-400 animate-pulse',
  };

  return (
    <div
      className={cn('inline-flex items-center gap-1.5 text-sm font-mono font-bold', slaColors[slaStatus], className)}
      aria-label={`Elapsed time: ${display}${slaStatus === 'delayed' ? ', delayed' : slaStatus === 'warning' ? ', approaching SLA limit' : ''}`}
      role="timer"
    >
      {slaStatus === 'delayed' && (
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {slaStatus !== 'delayed' && (
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{display}</span>
      <span className="sr-only">{PRIORITY_LABELS[priority]} priority</span>
    </div>
  );
}
