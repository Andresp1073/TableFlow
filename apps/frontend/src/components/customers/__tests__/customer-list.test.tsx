import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomerList } from '../list/customer-list';
import type { Customer } from '@/lib/customer-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}));

const mockCustomers: Customer[] = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+1234567890', status: 'active', isVip: false, totalVisits: 15, createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: null, status: 'active', isVip: true, totalVisits: 42, createdAt: '2024-03-20T00:00:00Z', updatedAt: '2024-06-10T00:00:00Z' },
  { id: '3', firstName: 'Bob', lastName: 'Johnson', email: null, phone: '+9876543210', status: 'archived', isVip: false, totalVisits: 8, createdAt: '2023-11-05T00:00:00Z', updatedAt: '2024-05-20T00:00:00Z' },
];

describe('CustomerList', () => {
  it('renders loading state', () => {
    const { container } = render(<CustomerList data={[]} loading error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(container.querySelectorAll('.animate-shimmer').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<CustomerList data={[]} loading={false} error="Failed to load" onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getByText(/error loading data/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<CustomerList data={[]} loading={false} error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
  });

  it('renders customer rows', () => {
    render(<CustomerList data={mockCustomers} loading={false} error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('shows active status badge', () => {
    render(<CustomerList data={mockCustomers} loading={false} error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges.length).toBeGreaterThan(0);
  });

  it('shows archived status badge', () => {
    render(<CustomerList data={mockCustomers} loading={false} error={null} onArchive={vi.fn()} onRestore={vi.fn()} />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });
});
