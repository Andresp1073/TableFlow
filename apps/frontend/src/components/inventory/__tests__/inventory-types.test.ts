import { getStatusColor, formatCurrency, formatUnit } from '@/lib/inventory-types';

describe('inventory-types utilities', () => {
  describe('getStatusColor', () => {
    it('returns correct color for each status', () => {
      expect(getStatusColor('Draft')).toBe('secondary');
      expect(getStatusColor('Submitted')).toBe('info');
      expect(getStatusColor('Approved')).toBe('warning');
      expect(getStatusColor('Received')).toBe('success');
      expect(getStatusColor('Cancelled')).toBe('danger');
    });

    it('returns secondary for unknown status', () => {
      expect(getStatusColor('Unknown')).toBe('secondary');
    });
  });

  describe('formatCurrency', () => {
    it('formats number as USD currency', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('formatUnit', () => {
    it('formats value with unit', () => {
      expect(formatUnit(5, 'Kg')).toBe('5 Kg');
      expect(formatUnit(10, 'L')).toBe('10 L');
    });
  });
});
