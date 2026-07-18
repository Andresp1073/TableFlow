import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import type { RestaurantTable } from '@/lib/table-types';
import * as tableService from '@/services/tables';
import EditTablePage from '../[tableId]/edit/page';

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
  usePathname: () => '/tables/table-1/edit',
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

describe('EditTablePage (top-level)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(tableService, 'getTable').mockResolvedValue(mockTable);
  });

  it('renders edit page title with table number when loaded', async () => {
    render(React.createElement(EditTablePage), { wrapper: createWrapper() });
    expect(await screen.findByText('Edit: Table T01')).toBeInTheDocument();
    expect(screen.getByText('Update table configuration')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    render(React.createElement(EditTablePage), { wrapper: createWrapper() });
    expect(await screen.findByText('Back to Details')).toBeInTheDocument();
  });

  it('renders form fields with existing data', async () => {
    render(React.createElement(EditTablePage), { wrapper: createWrapper() });
    expect(await screen.findByLabelText('Table Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Table shape')).toBeInTheDocument();
  });

  it('renders save button', async () => {
    render(React.createElement(EditTablePage), { wrapper: createWrapper() });
    expect(await screen.findByText('Save Changes')).toBeInTheDocument();
  });
});
