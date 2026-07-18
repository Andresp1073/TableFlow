import { getTierColor, getRedemptionStatusColor, formatPoints, formatTierLabel } from '@/lib/loyalty-types';

describe('loyalty-types utilities', () => {
  describe('getTierColor', () => {
    it('returns correct color for each tier', () => {
      expect(getTierColor('bronze')).toBe('secondary');
      expect(getTierColor('silver')).toBe('default');
      expect(getTierColor('gold')).toBe('warning');
      expect(getTierColor('platinum')).toBe('info');
      expect(getTierColor('custom')).toBe('info');
    });
  });

  describe('getRedemptionStatusColor', () => {
    it('returns correct color for each status', () => {
      expect(getRedemptionStatusColor('requested')).toBe('warning');
      expect(getRedemptionStatusColor('validated')).toBe('info');
      expect(getRedemptionStatusColor('approved')).toBe('info');
      expect(getRedemptionStatusColor('completed')).toBe('success');
      expect(getRedemptionStatusColor('cancelled')).toBe('secondary');
    });
  });

  describe('formatPoints', () => {
    it('formats number with locale separators', () => {
      expect(formatPoints(1000)).toBe('1,000');
      expect(formatPoints(0)).toBe('0');
      expect(formatPoints(1500000)).toBe('1,500,000');
    });
  });

  describe('formatTierLabel', () => {
    it('capitalizes tier name', () => {
      expect(formatTierLabel('bronze')).toBe('Bronze');
      expect(formatTierLabel('gold')).toBe('Gold');
      expect(formatTierLabel('platinum')).toBe('Platinum');
    });
  });
});
