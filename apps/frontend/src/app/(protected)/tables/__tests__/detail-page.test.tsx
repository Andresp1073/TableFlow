import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import type { RestaurantTable } from '@/lib/table-types';
import * as tableService from '@/services/tables';
import TableDetailPage from '../[tableId]/page';

const mockTable: RestaurantTable = {
  id: 'table-1', restaurantId: 'rest-1', branchId: 'branch-1', diningAreaId: 'area-1',
  tableTypeId: null, tableNumber: 'T01', name: 'Window Table', description: 'Great view',
  minimumCapacity: 2, maximumCapacity: 4, currentCapacity: 0, shape: 'rectangle',
  width: 60, height: 60, positionX: 100, positionY: 200, rotation: 0,
  qrIdentifier: null, isReservable: true, isAccessible: true, isActive: true,
  status: 'available', metadata: null, createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-15T00:00:00Z', deletedAt: null,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ tableId: 'table-1' }),
  usePathname: () => '/tables/table-1',
}));

function RestaurantSetup({ children }: { children: React.ReactNode }) {
  const { setCurrent, setRestaurants } = useRestaurant();
  React.useEffect(() => {
    setCurrent({ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' });
    setRestaurants([{ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' }]);
  }, [setCurrent, setRestaurants]);
  return React.createElement(React.Fragment, null, children);
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(RestaurantProvider, null,
        React.createElement(RestaurantSetup, null, children),
      ),
    );
  };
}

describe('TableDetailPage (top-level)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(tableService, 'getTable').mockResolvedValue(mockTable);
    vi.spyOn(tableService, 'getTableTransitions').mockResolvedValue({
      status: 'available',
      allowedTransitions: ['occupied', 'reserved', 'cleaning'],
    });
  });

  it('renders table number and name when loaded', async () => {
    render(React.createElement(TableDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText(/Table T01/)).toBeInTheDocument();
    expect(screen.getAllByText(/Window Table/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders detail cards', async () => {
    render(React.createElement(TableDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Table Information')).toBeInTheDocument();
    expect(screen.getByText('Capacity & Status')).toBeInTheDocument();
    expect(screen.getByText('Position & Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Audit Information')).toBeInTheDocument();
  });

  it('renders status badge and status text', async () => {
    render(React.createElement(TableDetailPage), { wrapper: createWrapper() });
    await screen.findAllByText('Available');
    const badges = screen.getAllByText('Available');
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('renders configuration details', async () => {
    render(React.createElement(TableDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('2 – 4')).toBeInTheDocument();
    const yesLabels = screen.getAllByText('Yes');
    expect(yesLabels.length).toBeGreaterThanOrEqual(2);
  });

  it('renders description when present', async () => {
    render(React.createElement(TableDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Great view')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    render(React.createElement(TableDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Back to Tables')).toBeInTheDocument();
  });

  it('renders audit information', async () => {
    render(React.createElement(TableDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('table-1')).toBeInTheDocument();
  });

  it('renders actions component', async () => {
    render(React.createElement(TableDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Edit')).toBeInTheDocument();
  });
});
