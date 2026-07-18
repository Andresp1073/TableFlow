import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomerDashboardContent } from '../dashboard/customer-dashboard-content';
import type { CustomerDashboardData } from '@/lib/customer-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}));

const mockData: CustomerDashboardData = {
  totalCustomers: 250,
  activeCustomers: 200,
  archivedCustomers: 50,
  newCustomers: 30,
  returningCustomers: 80,
  vipCustomers: 15,
  birthdayCount: 5,
  totalVisits: 3200,
  averageVisitsPerCustomer: 13,
  customerGrowth: 12,
  recentRegistrations: [
    { id: 'c1', firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com', phone: null, createdAt: '2024-06-18T00:00:00Z', status: 'active' },
    { id: 'c2', firstName: 'Charlie', lastName: 'Davis', email: 'charlie@example.com', phone: '+1112223333', createdAt: '2024-06-17T00:00:00Z', status: 'active' },
  ],
  birthdays: [
    { id: 'c3', firstName: 'Eve', lastName: 'Wilson', email: 'eve@example.com', birthDate: '1992-07-04T00:00:00Z' },
  ],
};

describe('CustomerDashboardContent', () => {
  it('renders loading state', () => {
    const { container } = render(<CustomerDashboardContent isLoading isError={false} />);
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<CustomerDashboardContent isLoading={false} isError error={new Error('API Error')} />);
    expect(screen.getByText(/failed to load customer dashboard/i)).toBeInTheDocument();
  });

  it('renders stat cards with data', () => {
    render(<CustomerDashboardContent data={mockData} isLoading={false} isError={false} />);
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('renders recent registrations', () => {
    render(<CustomerDashboardContent data={mockData} isLoading={false} isError={false} />);
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    expect(screen.getByText('Charlie Davis')).toBeInTheDocument();
  });

  it('renders birthdays section', () => {
    render(<CustomerDashboardContent data={mockData} isLoading={false} isError={false} />);
    expect(screen.getByText('Eve Wilson')).toBeInTheDocument();
  });

  it('shows growth rate', () => {
    render(<CustomerDashboardContent data={mockData} isLoading={false} isError={false} />);
    expect(screen.getByText('12%')).toBeInTheDocument();
  });
});
