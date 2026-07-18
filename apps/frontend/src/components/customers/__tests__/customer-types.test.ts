import { getCustomerStatusColor } from '@/lib/customer-types';

describe('customer-types utilities', () => {
  describe('getCustomerStatusColor', () => {
    it('returns correct color for each status', () => {
      expect(getCustomerStatusColor('active')).toBe('success');
      expect(getCustomerStatusColor('archived')).toBe('secondary');
    });
  });
});
