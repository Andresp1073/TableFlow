'use client';
import { t } from '@/lib/i18n';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
}

export function PageHeader({ title, description, createHref, createLabel }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {createHref && (
        <Link href={createHref}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {createLabel ?? 'Create'}
          </Button>
        </Link>
      )}
    </div>
  );
}
