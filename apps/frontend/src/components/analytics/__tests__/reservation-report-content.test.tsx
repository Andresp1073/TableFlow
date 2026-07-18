import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReservationReportContent } from '../reservation-report-content';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
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
  useReservationReport: vi.fn(),
}));

import { useReservationReport } from '@/hooks/use-analytics';

describe('ReservationReportContent', () => {
  it('shows error state', () => {
    (useReservationReport as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('API Error'),
      refetch: vi.fn(),
    });

    render(<ReservationReportContent />);
    expect(screen.getByText(/failed to load report/i)).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    (useReservationReport as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        summary: {
          totalReservations: 100,
          confirmed: 60,
          cancelled: 10,
          noShows: 5,
          completed: 25,
          averagePartySize: 3.5,
          cancellationRate: 10,
          noShowRate: 5,
        },
        reservationsByPeriod: [],
        reservationsByStatus: [],
        reservationsByHour: [],
        peakHours: [{ hour: '19:00', count: 30 }],
        tableUtilization: [{ name: 'Indoor', reservations: 60, utilizationRate: 78 }],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ReservationReportContent />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('10.0%')).toBeInTheDocument();
  });

  it('renders peak hours', () => {
    (useReservationReport as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        summary: { totalReservations: 0, confirmed: 0, cancelled: 0, noShows: 0, completed: 0, averagePartySize: 0, cancellationRate: 0, noShowRate: 0 },
        reservationsByPeriod: [],
        reservationsByStatus: [],
        reservationsByHour: [],
        peakHours: [{ hour: '19:00', count: 30 }],
        tableUtilization: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<ReservationReportContent />);
    expect(screen.getByText('19:00')).toBeInTheDocument();
  });
});
