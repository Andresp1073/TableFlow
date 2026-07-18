'use client';

import { Search } from 'lucide-react';
import { useKeyboardShortcut } from '@/hooks/use-keyboard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SearchBar } from '@/components/ui/search-bar';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useKeyboardShortcut({ key: 'k', meta: true }, () => setOpen(true), !open);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'relative h-8 w-48 justify-start text-xs text-muted-foreground',
            'bg-muted/50 hover:bg-muted',
          )}
          aria-label={t('Search (Cmd+K)')}
        >
          <Search className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('Search...')}</span>
          <kbd className="ml-auto hidden lg:inline-flex h-5 items-center gap-0.5 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="top-[15%] -translate-y-0 sm:top-[20%]">
        <DialogHeader className="sr-only">
          <DialogTitle>{t('Search')}</DialogTitle>
          <DialogDescription>{t('Search across the application')}</DialogDescription>
        </DialogHeader>
        <SearchBar
          placeholder={t('Search restaurants, reservations, customers...')}
          className="mt-2"
          autoFocus
        />
        <div className="px-1 py-2 text-xs text-muted-foreground">
          <p>{t('Press')} <kbd className="rounded border bg-muted px-1 font-mono">↑</kbd><kbd className="rounded border bg-muted px-1 font-mono">↓</kbd> {t('to navigate,')} <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd> {t('to select')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
