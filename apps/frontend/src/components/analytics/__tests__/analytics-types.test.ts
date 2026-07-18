import { describe, it, expect } from 'vitest';
import {
  getDateRangeFromPreset,
  formatNumber,
  formatCurrency,
  formatPercent,
  DATE_RANGE_PRESETS,
  REPORT_META,
} from '@/lib/analytics-types';

describe('DATE_RANGE_PRESETS', () => {
  it('has all expected presets', () => {
    const values = DATE_RANGE_PRESETS.map((p) => p.value);
    expect(values).toContain('today');
    expect(values).toContain('thisWeek');
    expect(values).toContain('thisMonth');
    expect(values).toContain('thisQuarter');
    expect(values).toContain('thisYear');
    expect(values).toContain('lastMonth');
  });
});

describe('REPORT_META', () => {
  it('has entries for all reports', () => {
    expect(REPORT_META['executive']).toBeDefined();
    expect(REPORT_META['sales']).toBeDefined();
    expect(REPORT_META['reservations']).toBeDefined();
    expect(REPORT_META['occupancy']).toBeDefined();
    expect(REPORT_META['inventory']).toBeDefined();
    expect(REPORT_META['kitchen']).toBeDefined();
    expect(REPORT_META['customers']).toBeDefined();
    expect(REPORT_META['financial']).toBeDefined();
    expect(REPORT_META['audit']).toBeDefined();
  });

  it('each entry has required fields', () => {
    for (const meta of Object.values(REPORT_META)) {
      expect(meta.title).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.category).toBeTruthy();
      expect(meta.icon).toBeTruthy();
    }
  });
});

describe('getDateRangeFromPreset', () => {
  it('returns from and to for today', () => {
    const range = getDateRangeFromPreset('today');
    expect(range.from).toBeTruthy();
    expect(range.to).toBeTruthy();
    expect(range.preset).toBe('today');
  });

  it('returns from and to for thisMonth', () => {
    const range = getDateRangeFromPreset('thisMonth');
    expect(range.from).toBeTruthy();
    expect(range.to).toBeTruthy();
  });

  it('returns from and to for lastMonth with correct preset', () => {
    const range = getDateRangeFromPreset('lastMonth');
    expect(range.from).toBeTruthy();
    expect(range.to).toBeTruthy();
    expect(range.preset).toBe('lastMonth');
  });
});

describe('formatNumber', () => {
  it('formats integers', () => {
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('formats with decimals', () => {
    expect(formatNumber(1234.5, 1)).toBe('1,234.5');
  });
});

describe('formatCurrency', () => {
  it('formats USD currency', () => {
    const result = formatCurrency(1234.5);
    expect(result).toMatch(/\$1,234\.50/);
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});

describe('formatPercent', () => {
  it('formats percentage', () => {
    expect(formatPercent(75.3)).toBe('75.3%');
  });

  it('formats with default decimals', () => {
    expect(formatPercent(50)).toBe('50.0%');
  });
});
