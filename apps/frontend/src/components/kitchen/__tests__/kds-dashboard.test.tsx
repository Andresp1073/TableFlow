import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KdsDashboard } from '../kds-dashboard';
import type { KitchenTicket, KitchenStationInfo, KitchenStats } from '@/lib/order-types';

function createTicket(id: string, status: KitchenTicket['status'], overrides: Partial<KitchenTicket> = {}): KitchenTicket {
  return {
    id,
    restaurantId: 'rest-1',
    kitchenId: 'kitchen-1',
    orderId: `order-${id}`,
    stationId: 'station-1',
    priority: 'normal',
    status,
    items: [{ id: `${id}-item-1`, menuItemId: 'menu-1', menuItemName: 'Pizza', quantity: 1, status: 'pending', stationId: 'station-1', modifiers: [] }],
    notes: [],
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
    deliveredAt: null,
    ...overrides,
  };
}

const mockStats: KitchenStats = {
  totalOrders: 10, pending: 3, preparing: 4, ready: 2, completed: 1,
  averagePrepTime: 420, slaLate: 1,
};

const mockStations: KitchenStationInfo[] = [
  { id: 's1', kitchenId: 'k1', name: 'Grill', type: 'grill', status: 'active', displayOrder: 1, maxConcurrentTickets: 5, currentTickets: 2, assignedStaff: [], isAvailable: true },
  { id: 's2', kitchenId: 'k1', name: 'Bar', type: 'bar', status: 'active', displayOrder: 2, maxConcurrentTickets: 3, currentTickets: 1, assignedStaff: [], isAvailable: true },
];

describe('KdsDashboard', () => {
  it('shows loading state', () => {
    render(
      <KdsDashboard
        restaurantId="rest-1"
        tickets={undefined}
        stations={undefined}
        stats={null}
        isLoading={true}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Loading orders...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <KdsDashboard
        restaurantId="rest-1"
        tickets={undefined}
        stations={undefined}
        stats={null}
        isLoading={false}
        isError={true}
        error={new Error('Network error')}
        onRetry={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
  });

  it('renders empty state when no tickets', () => {
    render(
      <KdsDashboard
        restaurantId="rest-1"
        tickets={[]}
        stations={mockStations}
        stats={mockStats}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );
    expect(screen.getByText('No active orders')).toBeInTheDocument();
  });

  it('renders header with title', () => {
    render(
      <KdsDashboard
        restaurantId="rest-1"
        tickets={[]}
        stations={mockStations}
        stats={mockStats}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onStatusChange={vi.fn()}
        title="Test KDS"
      />,
    );
    expect(screen.getByText('Test KDS')).toBeInTheDocument();
  });

  it('renders stats badges when stats are provided', () => {
    render(
      <KdsDashboard
        restaurantId="rest-1"
        tickets={[]}
        stations={mockStations}
        stats={mockStats}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('New: 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Prep: 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Ready: 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Late: 1')).toBeInTheDocument();
  });

  it('renders order cards for tickets', () => {
    const tickets = [
      createTicket('t1', 'new'),
      createTicket('t2', 'preparing'),
      createTicket('t3', 'ready'),
    ];
    render(
      <KdsDashboard
        restaurantId="rest-1"
        tickets={tickets}
        stations={mockStations}
        stats={mockStats}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('article').length).toBe(3);
  });

  it('filters tickets by selected station', async () => {
    const user = userEvent.setup();
    const tickets = [
      createTicket('t1', 'new', { stationId: 's1' }),
      createTicket('t2', 'new', { stationId: 's2' }),
    ];
    render(
      <KdsDashboard
        restaurantId="rest-1"
        tickets={tickets}
        stations={mockStations}
        stats={mockStats}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );

    // Initially shows both
    expect(screen.getAllByRole('article').length).toBe(2);

    // Click Bar filter
    await user.click(screen.getByText('Bar'));

    // Wait for filter to apply (AnimatePresence may delay removal)
    await waitFor(() => {
      expect(screen.getAllByRole('article').length).toBe(1);
    });
  });

  it('shows station selector in header', () => {
    render(
      <KdsDashboard
        restaurantId="rest-1"
        tickets={[]}
        stations={mockStations}
        stats={mockStats}
        isLoading={false}
        isError={false}
        error={null}
        onRetry={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );

    expect(screen.getByText('All Stations')).toBeInTheDocument();
    expect(screen.getByText('Grill')).toBeInTheDocument();
    expect(screen.getByText('Bar')).toBeInTheDocument();
  });
});
