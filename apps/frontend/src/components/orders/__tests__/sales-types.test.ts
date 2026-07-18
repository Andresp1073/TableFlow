import { formatCurrency, getOrderStatusColor, ORDER_STATUS_LABELS, ORDER_SOURCE_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/sales-types';

describe('sales-types utilities', () => {
  describe('formatCurrency', () => {
    it('formats whole dollars', () => {
      expect(formatCurrency(10)).toBe('$10.00');
    });

    it('formats with cents', () => {
      expect(formatCurrency(10.5)).toBe('$10.50');
    });

    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('getOrderStatusColor', () => {
    it('returns correct color for each status', () => {
      expect(getOrderStatusColor('draft')).toBe('text-yellow-500');
      expect(getOrderStatusColor('completed')).toBe('text-gray-500');
      expect(getOrderStatusColor('cancelled')).toBe('text-red-500');
    });
  });

  describe('ORDER_STATUS_LABELS', () => {
    it('contains all status labels', () => {
      expect(ORDER_STATUS_LABELS['draft']).toBe('Draft');
      expect(ORDER_STATUS_LABELS['in_progress']).toBe('In Progress');
      expect(ORDER_STATUS_LABELS['completed']).toBe('Completed');
    });
  });

  describe('ORDER_SOURCE_LABELS', () => {
    it('contains all source labels', () => {
      expect(ORDER_SOURCE_LABELS['pos']).toBe('POS');
      expect(ORDER_SOURCE_LABELS['walk_in']).toBe('Walk-in');
    });
  });

  describe('PAYMENT_STATUS_LABELS', () => {
    it('contains all payment status labels', () => {
      expect(PAYMENT_STATUS_LABELS['paid']).toBe('Paid');
      expect(PAYMENT_STATUS_LABELS['unpaid']).toBe('Unpaid');
    });
  });
});
