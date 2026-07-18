import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodayReservationsWidget } from '../widgets/today-reservations';
import { CurrentOccupancyWidget } from '../widgets/current-occupancy';
import { AvailableTablesWidget } from '../widgets/available-tables';
import { KitchenStatusWidget } from '../widgets/kitchen-status';
import { PendingOrdersWidget } from '../widgets/pending-orders';
import { LowInventoryAlertsWidget } from '../widgets/low-inventory-alerts';
import { RevenueSummaryWidget } from '../widgets/revenue-summary';
import { RecentActivityWidget } from '../widgets/recent-activity';
import { UpcomingReservationsWidget } from '../widgets/upcoming-reservations';
import { QuickStatisticsWidget } from '../widgets/quick-statistics';
import type {
  TodayReservationsData,
  CurrentOccupancyData,
  AvailableTablesData,
  KitchenStatusData,
  LowInventoryAlertsData,
  RevenueSummaryData,
  RecentActivityItem,
  UpcomingReservationItem,
  QuickStatisticsData,
} from '@/lib/dashboard-types';

const defaultProps = {
  isLoading: false,
  isError: false,
  error: null,
  onRefresh: vi.fn(),
  onRetry: vi.fn(),
};

describe('TodayReservationsWidget', () => {
  const data: TodayReservationsData = {
    total: 25, pending: 5, confirmed: 8, seated: 4, completed: 6, cancelled: 2, noShow: 0,
  };

  it('renders total count', () => {
    render(<TodayReservationsWidget data={data} {...defaultProps} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(<TodayReservationsWidget {...defaultProps} isLoading data={undefined} />);
    expect(container.querySelector('.animate-shimmer')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<TodayReservationsWidget {...defaultProps} isError error={new Error('API Error')} data={undefined} />);
    expect(screen.getByText('API Error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows empty state', () => {
    const emptyData: TodayReservationsData = { total: 0, pending: 0, confirmed: 0, seated: 0, completed: 0, cancelled: 0, noShow: 0 };
    render(<TodayReservationsWidget data={emptyData} {...defaultProps} />);
    expect(screen.getByText('No reservations today')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<TodayReservationsWidget {...defaultProps} isError error={new Error('API Error')} data={undefined} />);
    expect(screen.getByText(/API Error/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});

describe('CurrentOccupancyWidget', () => {
  const data: CurrentOccupancyData = {
    totalTables: 20, occupiedTables: 12, occupancyRate: 60, totalCapacity: 80, currentGuests: 36,
  };

  it('renders occupancy percentage', () => {
    render(<CurrentOccupancyWidget data={data} {...defaultProps} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows guests count', () => {
    render(<CurrentOccupancyWidget data={data} {...defaultProps} />);
    expect(screen.getByText('36')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    const emptyData: CurrentOccupancyData = { totalTables: 0, occupiedTables: 0, occupancyRate: 0, totalCapacity: 0, currentGuests: 0 };
    render(<CurrentOccupancyWidget data={emptyData} {...defaultProps} />);
    expect(screen.getByText('No tables configured')).toBeInTheDocument();
  });
});

describe('AvailableTablesWidget', () => {
  const data: AvailableTablesData = {
    total: 20, available: 6, reserved: 4, occupied: 8, maintenance: 2,
  };

  it('renders available count', () => {
    render(<AvailableTablesWidget data={data} {...defaultProps} />);
    const sixes = screen.getAllByText('6');
    expect(sixes.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/of 20 free/)).toBeInTheDocument();
  });

  it('shows empty state', () => {
    const emptyData: AvailableTablesData = { total: 0, available: 0, reserved: 0, occupied: 0, maintenance: 0 };
    render(<AvailableTablesWidget data={emptyData} {...defaultProps} />);
    expect(screen.getByText('No tables configured')).toBeInTheDocument();
  });
});

describe('KitchenStatusWidget', () => {
  it('renders empty state when no orders', () => {
    const data: KitchenStatusData = { totalOrders: 0, pending: 0, preparing: 0, ready: 0, completed: 0 };
    render(<KitchenStatusWidget data={data} {...defaultProps} />);
    expect(screen.getByText('Kitchen tracking coming soon')).toBeInTheDocument();
  });
});

describe('PendingOrdersWidget', () => {
  it('renders empty state', () => {
    render(<PendingOrdersWidget data={{ total: 0, items: [] }} {...defaultProps} />);
    expect(screen.getByText('No pending orders')).toBeInTheDocument();
  });
});

describe('LowInventoryAlertsWidget', () => {
  it('renders healthy state', () => {
    render(<LowInventoryAlertsWidget data={{ total: 0, items: [] }} {...defaultProps} />);
    expect(screen.getByText('All inventory levels are healthy')).toBeInTheDocument();
  });

  it('renders alert items when present', () => {
    const data: LowInventoryAlertsData = {
      total: 2,
      items: [
        { id: '1', name: 'Tomatoes', currentStock: 3, minimumStock: 10, unit: 'kg' },
        { id: '2', name: 'Olive Oil', currentStock: 1, minimumStock: 5, unit: 'L' },
      ],
    };
    render(<LowInventoryAlertsWidget data={data} {...defaultProps} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Tomatoes')).toBeInTheDocument();
    expect(screen.getByText('Olive Oil')).toBeInTheDocument();
  });
});

describe('RevenueSummaryWidget', () => {
  it('renders coming soon for empty data', () => {
    const data: RevenueSummaryData = { today: 0, thisWeek: 0, thisMonth: 0 };
    render(<RevenueSummaryWidget data={data} {...defaultProps} />);
    expect(screen.getByText('Revenue data coming soon')).toBeInTheDocument();
  });
});

describe('RecentActivityWidget', () => {
  const items: RecentActivityItem[] = [
    { id: '1', action: 'created', entity: 'reservation', entityId: 'abc', description: 'created reservation', userName: 'John Doe', createdAt: new Date().toISOString() },
    { id: '2', action: 'cancelled', entity: 'reservation', entityId: 'def', description: 'cancelled reservation', userName: 'Jane Smith', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ];

  it('renders activity items', () => {
    render(<RecentActivityWidget data={items} {...defaultProps} />);
    expect(screen.getByText('created')).toBeInTheDocument();
    expect(screen.getByText('cancelled')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<RecentActivityWidget data={[]} {...defaultProps} />);
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });
});

describe('UpcomingReservationsWidget', () => {
  const items: UpcomingReservationItem[] = [
    { id: '1', customerName: 'Alice Johnson', customerEmail: 'alice@test.com', partySize: 4, startTime: new Date().toISOString(), status: 'confirmed', tableNumber: '12', notes: null },
    { id: '2', customerName: 'Bob Smith', customerEmail: null, partySize: 2, startTime: new Date(Date.now() + 7200000).toISOString(), status: 'pending', tableNumber: null, notes: 'Anniversary' },
  ];

  it('renders reservation items', () => {
    render(<UpcomingReservationsWidget data={items} {...defaultProps} />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('renders party size', () => {
    render(<UpcomingReservationsWidget data={items} {...defaultProps} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<UpcomingReservationsWidget data={[]} {...defaultProps} />);
    expect(screen.getByText('No upcoming reservations')).toBeInTheDocument();
  });
});

describe('QuickStatisticsWidget', () => {
  const data: QuickStatisticsData = {
    totalCustomers: 1250, averagePartySize: 3, totalReservationsToday: 25, cancellationRate: 8, noShowRate: 5, peakHour: '19:00',
  };

  it('renders statistics', () => {
    render(<QuickStatisticsWidget data={data} {...defaultProps} />);
    expect(screen.getByText('Total Customers')).toBeInTheDocument();
    expect(screen.getByText('19:00')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<QuickStatisticsWidget {...defaultProps} data={undefined} />);
    expect(screen.getByText('No statistics available')).toBeInTheDocument();
  });
});
