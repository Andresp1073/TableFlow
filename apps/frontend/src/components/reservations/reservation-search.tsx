'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface ReservationSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function ReservationSearch({
  onSearch,
  placeholder = 'Search reservations by number, guest name, or notes...',
  className,
}: ReservationSearchProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(value);
    },
    [onSearch, value],
  );

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)} role="search">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (!e.target.value) onSearch('');
        }}
        placeholder={placeholder}
        className="pl-10 pr-10"
        aria-label="Search reservations"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
