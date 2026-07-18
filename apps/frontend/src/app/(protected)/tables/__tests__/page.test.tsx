import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import type { RestaurantTable } from '@/lib/table-types';
import * as tableService from '@/services/tables';
import TablesPage from '../page';

const mockTables: RestaurantTable[] = [
  {
    id: 'table-1', restaurantId: 'rest-1', branchId: 'branch-1', diningAreaId: 'area-1',
    tableTypeId: null, tableNumber: 'T01', name: 'Window Table', description: null,
    minimumCapacity: 2, maximumCapacity: 4, currentCapacity: 0, shape: 'rectangle',
    width: 60, height: 60, positionX: null, positionY: null, rotation: null,
    qrIdentifier: null, isReservable: true, isAccessible: true, isActive: true,
    status: 'available', metadata: null, createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z', deletedAt: null,
  },
  {
    id: 'table-2', restaurantId: 'rest-1', branchId: 'branch-1', diningAreaId: 'area-1',
    tableTypeId: null, tableNumber: 'T02', name: 'Corner Booth', description: null,
    minimumCapacity: 4, maximumCapacity: 6, currentCapacity: 2, shape: 'round',
    width: 60, height: 60, positionX: null, positionY: null, rotation: null,
    qrIdentifier: null, isReservable: true, isAccessible: false, isActive: true,
    status: 'occupied', metadata: null, createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z', deletedAt: null,
  },
];

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/tables',
}));

function RestaurantSetup({ children }: { children: React.ReactNode }) {
  const { setCurrent, setRestaurants } = useRestaurant();
  React.useEffect(() => {
    setCurrent({ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' });
    setRestaurants([{ id: 'rest-1', name: 'Test Restaurant', slug: 'test-rest' }]);
  }, [setCurrent, setRestaurants]);
  return React.createElement(React.Fragment, null, children);
}

function createWrapper(withRestaurant = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(RestaurantProvider, null,
        withRestaurant
          ? React.createElement(RestaurantSetup, null, children)
          : children,
      ),
    );
  };
}

describe('TablesPage (top-level)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the page title and description', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    render(React.createElement(TablesPage), { wrapper: createWrapper() });
    expect(screen.getByText('Tables')).toBeInTheDocument();
    expect(screen.getByText('Manage table configurations, layouts, and availability')).toBeInTheDocument();
  });

  it('renders the new table button', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    render(React.createElement(TablesPage), { wrapper: createWrapper() });
    expect(screen.getByText('New Table')).toBeInTheDocument();
  });

  it('renders the search input and status filter', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    render(React.createElement(TablesPage), { wrapper: createWrapper() });
    expect(screen.getByLabelText('Search tables')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
  });

  it('renders table rows from API data', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    render(React.createElement(TablesPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('T01')).toBeInTheDocument();
    });
    expect(screen.getByText('T02')).toBeInTheDocument();
  });

  it('shows total table count', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    render(React.createElement(TablesPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('2 tables')).toBeInTheDocument();
    });
  });

  it('filters tables by search', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    render(React.createElement(TablesPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('T01')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search tables');
    await userEvent.type(searchInput, 'T02');

    expect(screen.getByText('T02')).toBeInTheDocument();
    expect(screen.queryByText('T01')).not.toBeInTheDocument();
  });

  it('shows empty state when no tables', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue([]);
    render(React.createElement(TablesPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('No tables found')).toBeInTheDocument();
    });
  });

  it('shows create link in empty state', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue([]);
    render(React.createElement(TablesPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Create your first table')).toBeInTheDocument();
    });
  });

  it('shows no restaurant message when no restaurant selected', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    render(React.createElement(TablesPage), { wrapper: createWrapper(false) });
    expect(screen.getByText('Select a restaurant to manage tables')).toBeInTheDocument();
  });

  it('renders status badges', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    render(React.createElement(TablesPage), { wrapper: createWrapper() });
    await waitFor(() => {
      const badges = screen.getAllByText('Available');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });
});
