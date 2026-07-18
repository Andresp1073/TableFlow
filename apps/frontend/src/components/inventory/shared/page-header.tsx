'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
  onAction?: () => void;
}

export function PageHeader({ title, description, createHref, createLabel, onAction }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {createHref && (
          <Button asChild>
            <Link href={createHref}>
              <Plus className="h-4 w-4 mr-1" />
              {createLabel ?? 'Create'}
            </Link>
          </Button>
        )}
        {onAction && (
          <Button onClick={onAction}>
            <Plus className="h-4 w-4 mr-1" />
            {createLabel ?? 'Create'}
          </Button>
        )}
      </div>
    </div>
  );
}
