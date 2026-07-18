import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomerProfileView } from '../profile/customer-profile-view';
import type { CustomerDetail } from '@/lib/customer-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}));

const mockCustomer: CustomerDetail = {
  id: '1',
  restaurantId: 'r1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  birthDate: '1990-05-15T00:00:00Z',
  preferredLanguage: 'en',
  notes: 'Regular customer, prefers window tables',
  marketingConsent: true,
  status: 'active',
  isVip: true,
  totalVisits: 25,
  totalSpent: 3450,
  averageTicket: 138,
  preferredRestaurantId: null,
  preferredTableId: null,
  dietaryRestrictions: ['Gluten-free'],
  preferences: { seating: 'window' },
  tags: ['VIP', 'Regular'],
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  archivedAt: null,
};

describe('CustomerProfileView', () => {
  it('renders loading state', () => {
    const { container } = render(<CustomerProfileView isLoading isError={false} />);
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<CustomerProfileView isLoading={false} isError />);
    expect(screen.getByText(/failed to load customer profile/i)).toBeInTheDocument();
  });

  it('renders customer information', () => {
    render(<CustomerProfileView data={mockCustomer} isLoading={false} isError={false} />);
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  it('shows VIP badge', () => {
    render(<CustomerProfileView data={mockCustomer} isLoading={false} isError={false} />);
    expect(screen.getAllByText('VIP').length).toBeGreaterThan(0);
  });

  it('shows active status', () => {
    render(<CustomerProfileView data={mockCustomer} isLoading={false} isError={false} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows notes', () => {
    render(<CustomerProfileView data={mockCustomer} isLoading={false} isError={false} />);
    expect(screen.getByText(/Regular customer/)).toBeInTheDocument();
  });

  it('shows tags', () => {
    render(<CustomerProfileView data={mockCustomer} isLoading={false} isError={false} />);
    expect(screen.getAllByText('VIP').length).toBeGreaterThan(0);
    expect(screen.getByText('Regular')).toBeInTheDocument();
  });

  it('shows total spent', () => {
    render(<CustomerProfileView data={mockCustomer} isLoading={false} isError={false} />);
    expect(screen.getByText('$3,450')).toBeInTheDocument();
  });
});
