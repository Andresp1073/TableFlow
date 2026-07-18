'use client';

import { useState, useCallback } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DATE_RANGE_PRESETS, getDateRangeFromPreset } from '@/lib/analytics-types';
import type { DateRange, DateRangePreset } from '@/lib/analytics-types';

interface ReportFiltersProps {
  onDateRangeChange?: (range: DateRange) => void;
  defaultPreset?: DateRangePreset;
}

export function ReportFilters({ onDateRangeChange, defaultPreset = 'thisMonth' }: ReportFiltersProps) {
  const [preset, setPreset] = useState<DateRangePreset>(defaultPreset);

  const handlePresetChange = useCallback((value: string) => {
    const p = value as DateRangePreset;
    setPreset(p);
    onDateRangeChange?.(getDateRangeFromPreset(p));
  }, [onDateRangeChange]);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Period:</span>
      </div>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]" aria-label="Select date range">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGE_PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">
        {getDateRangeFromPreset(preset).from.slice(0, 10)} – {getDateRangeFromPreset(preset).to.slice(0, 10)}
      </span>
    </div>
  );
}
