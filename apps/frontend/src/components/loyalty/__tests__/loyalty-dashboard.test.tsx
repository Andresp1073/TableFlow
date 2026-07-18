import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoyaltyDashboardContent } from '../loyalty-dashboard-content';
import type { LoyaltyDashboardData } from '@/lib/loyalty-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}));

const mockData: LoyaltyDashboardData = {
  totalEnrolled: 150,
  activeMembers: 120,
  totalPointsIssued: 45000,
  totalPointsRedeemed: 12500,
  totalPointsBalance: 32500,
  tierDistribution: { bronze: 80, silver: 40, gold: 25, platinum: 5 },
  totalRewardsAvailable: 12,
  totalRewardsRedeemed: 48,
  totalSpent: 125000,
  averageSpentPerMember: 833,
  recentRedemptions: [
    { id: 'r1', rewardId: 'rw1', rewardName: 'Free Dessert', pointsCost: 500, status: 'completed', requestedAt: '2024-06-15T00:00:00Z' },
    { id: 'r2', rewardId: 'rw2', rewardName: '$10 Off', pointsCost: 1000, status: 'requested', requestedAt: '2024-06-14T00:00:00Z' },
  ],
  activeProgram: {
    id: 'p1',
    name: 'Standard Rewards',
    pointsPerCurrencyUnit: 10,
    tiers: [
      { name: 'Bronze', minimumLifetimePoints: 0, pointsMultiplier: 1, benefits: ['Welcome bonus'] },
      { name: 'Silver', minimumLifetimePoints: 1000, pointsMultiplier: 1.5, benefits: ['Priority seating'] },
    ],
  },
};

describe('LoyaltyDashboardContent', () => {
  it('renders loading state', () => {
    const { container } = render(<LoyaltyDashboardContent isLoading isError={false} />);
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<LoyaltyDashboardContent isLoading={false} isError error={new Error('API Error')} />);
    expect(screen.getByText(/failed to load loyalty dashboard/i)).toBeInTheDocument();
  });

  it('renders stat cards with data', () => {
    render(<LoyaltyDashboardContent data={mockData} isLoading={false} isError={false} />);
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('renders tier distribution', () => {
    render(<LoyaltyDashboardContent data={mockData} isLoading={false} isError={false} />);
    expect(screen.getByText('bronze')).toBeInTheDocument();
    expect(screen.getByText('silver')).toBeInTheDocument();
    expect(screen.getByText('gold')).toBeInTheDocument();
    expect(screen.getByText('platinum')).toBeInTheDocument();
  });

  it('renders recent redemptions', () => {
    render(<LoyaltyDashboardContent data={mockData} isLoading={false} isError={false} />);
    expect(screen.getByText('Free Dessert')).toBeInTheDocument();
    expect(screen.getByText('$10 Off')).toBeInTheDocument();
  });

  it('shows formatted points', () => {
    render(<LoyaltyDashboardContent data={mockData} isLoading={false} isError={false} />);
    expect(screen.getByText('45,000')).toBeInTheDocument();
  });
});
