import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutiveDashboardContent } from '../executive-dashboard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

vi.mock('@/hooks/use-analytics', () => ({
  useExecutiveDashboard: vi.fn(),
}));

import { useExecutiveDashboard } from '@/hooks/use-analytics';

describe('ExecutiveDashboardContent', () => {
  it('shows error state', () => {
    (useExecutiveDashboard as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: vi.fn(),
    });

    render(<ExecutiveDashboardContent />);
    expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
  });

  it('renders stat cards with data', () => {
    (useExecutiveDashboard as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        revenue: { label: 'Total Revenue', value: '$12,500', trend: { value: '+12%', positive: true } },
        orders: { label: 'Total Orders', value: 150, trend: { value: '+8%', positive: true } },
        reservations: { label: 'Reservations', value: 25, trend: { value: '10 confirmed', positive: true } },
        occupancy: { label: 'Occupancy Rate', value: '78%', trend: { value: '45 guests', positive: true } },
        averageTicket: { label: 'Avg. Ticket', value: '$45.50', trend: { value: '+5%', positive: true } },
        inventoryValue: { label: 'Inventory Value', value: '$8,200', trend: { value: '2 alerts', positive: false } },
        topProducts: [{ name: 'Burger', revenue: 5000, quantity: 100 }],
        topCustomers: [{ name: 'John Doe', totalSpent: 1200, visits: 15 }],
        revenueChart: [{ label: 'Mon', value: 1000 }],
        ordersByDay: [{ label: 'Mon', value: 20 }],
        reservationStatus: [{ name: 'Confirmed', value: 10, color: '#22c55e' }],
        recentActivity: [
          { id: '1', action: 'created', entity: 'order', entityId: '1', description: 'Created order #1', userName: 'Alice', createdAt: new Date().toISOString() },
        ],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ExecutiveDashboardContent />);
    expect(screen.getByText('$12,500')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('$45.50')).toBeInTheDocument();
    expect(screen.getByText('$8,200')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('renders top products', () => {
    (useExecutiveDashboard as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        revenue: { label: 'Revenue', value: '$0' },
        orders: { label: 'Orders', value: 0 },
        reservations: { label: 'Reservations', value: 0 },
        occupancy: { label: 'Occupancy', value: '0%' },
        averageTicket: { label: 'Avg Ticket', value: '$0' },
        inventoryValue: { label: 'Inventory', value: '$0' },
        topProducts: [{ name: 'Burger', revenue: 5000, quantity: 100 }],
        topCustomers: [],
        revenueChart: [],
        ordersByDay: [],
        reservationStatus: [],
        recentActivity: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ExecutiveDashboardContent />);
    expect(screen.getByText('Burger')).toBeInTheDocument();
  });

  it('renders top customers', () => {
    (useExecutiveDashboard as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        revenue: { label: 'Revenue', value: '$0' },
        orders: { label: 'Orders', value: 0 },
        reservations: { label: 'Reservations', value: 0 },
        occupancy: { label: 'Occupancy', value: '0%' },
        averageTicket: { label: 'Avg Ticket', value: '$0' },
        inventoryValue: { label: 'Inventory', value: '$0' },
        topProducts: [],
        topCustomers: [{ name: 'John Doe', totalSpent: 1200, visits: 15 }],
        revenueChart: [],
        ordersByDay: [],
        reservationStatus: [],
        recentActivity: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ExecutiveDashboardContent />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
