'use client';

import { forwardRef, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDebounce } from '@/hooks/use-debounce';
import { Input, type InputProps } from '@/components/ui/input';

interface SearchBarProps extends Omit<InputProps, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, value: externalValue, onChange, onClear, debounceMs = 300, placeholder = 'Search...', ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(externalValue ?? '');
    const debouncedValue = useDebounce(internalValue, debounceMs);

    useEffect(() => {
      if (externalValue !== undefined) setInternalValue(externalValue);
    }, [externalValue]);

    useEffect(() => {
      onChange?.(debouncedValue);
    }, [debouncedValue, onChange]);

    const handleClear = () => {
      setInternalValue('');
      onClear?.();
    };

    return (
      <div className={cn('relative', className)}>
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={ref}
          value={internalValue}
          onChange={(e) => setInternalValue(e.target.value)}
          placeholder={placeholder}
          className="pl-8 pr-8"
          aria-label={placeholder}
          {...props}
        />
        {internalValue && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
SearchBar.displayName = 'SearchBar';

export { SearchBar };
