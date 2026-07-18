import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RewardHistoryView } from '../reward-history-view';
import type { Reward } from '@/lib/loyalty-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}));

const mockRewards: Reward[] = [
  {
    id: 'rw1', name: 'Free Dessert', description: 'Complimentary dessert on next visit', type: 'free_product',
    costInPoints: 500, value: 8.99, valueCurrency: 'USD', isActive: true,
    validFrom: '2024-01-01T00:00:00Z', validTo: '2024-12-31T00:00:00Z',
    remainingQuantity: 50, isCurrentlyAvailable: true,
  },
  {
    id: 'rw2', name: '$10 Off', description: '$10 discount on any meal', type: 'discount',
    costInPoints: 1000, value: 10.00, valueCurrency: 'USD', isActive: true,
    validFrom: '2024-01-01T00:00:00Z', validTo: null,
    remainingQuantity: null, isCurrentlyAvailable: true,
  },
  {
    id: 'rw3', name: 'VIP Table', description: 'Priority seating at premium tables', type: 'priority_reservation',
    costInPoints: 2500, value: 0, valueCurrency: 'USD', isActive: false,
    validFrom: '2024-01-01T00:00:00Z', validTo: '2024-06-01T00:00:00Z',
    remainingQuantity: 10, isCurrentlyAvailable: false,
  },
];

describe('RewardHistoryView', () => {
  it('renders loading state', () => {
    const { container } = render(<RewardHistoryView isLoading isError={false} />);
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<RewardHistoryView isLoading={false} isError />);
    expect(screen.getByText(/failed to load rewards/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<RewardHistoryView data={[]} isLoading={false} isError={false} />);
    expect(screen.getByText(/no rewards available/i)).toBeInTheDocument();
  });

  it('renders reward cards', () => {
    render(<RewardHistoryView data={mockRewards} isLoading={false} isError={false} />);
    expect(screen.getByText('Free Dessert')).toBeInTheDocument();
    expect(screen.getByText('$10 Off')).toBeInTheDocument();
    expect(screen.getByText('VIP Table')).toBeInTheDocument();
  });

  it('shows reward costs in points', () => {
    render(<RewardHistoryView data={mockRewards} isLoading={false} isError={false} />);
    expect(screen.getAllByText(/pts/).length).toBeGreaterThan(0);
  });

  it('shows unavailable badge for inactive rewards', () => {
    render(<RewardHistoryView data={mockRewards} isLoading={false} isError={false} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});
