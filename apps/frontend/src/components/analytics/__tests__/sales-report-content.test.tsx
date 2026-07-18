import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SalesReportContent } from '../sales-report-content';

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
  useSalesReport: vi.fn(),
}));

import { useSalesReport } from '@/hooks/use-analytics';

describe('SalesReportContent', () => {
  it('shows error state', () => {
    (useSalesReport as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed'),
      refetch: vi.fn(),
    });

    render(<SalesReportContent />);
    expect(screen.getByText(/failed to load sales report/i)).toBeInTheDocument();
  });

  it('renders summary cards with data', () => {
    (useSalesReport as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        summary: {
          totalRevenue: 15000,
          totalOrders: 300,
          averageOrderValue: 50,
          cancelledOrders: 5,
          refundedAmount: 120,
        },
        revenueByPeriod: [],
        ordersByPeriod: [],
        revenueByPaymentMethod: [],
        topSellingItems: [{ name: 'Pizza', quantity: 100, revenue: 2000 }],
        salesByHour: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SalesReportContent />);
    expect(screen.getByText('$15,000.00')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders top selling items', () => {
    (useSalesReport as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        summary: { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0, cancelledOrders: 0, refundedAmount: 0 },
        revenueByPeriod: [],
        ordersByPeriod: [],
        revenueByPaymentMethod: [],
        topSellingItems: [{ name: 'Pizza', quantity: 100, revenue: 2000 }],
        salesByHour: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<SalesReportContent />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
  });
});
