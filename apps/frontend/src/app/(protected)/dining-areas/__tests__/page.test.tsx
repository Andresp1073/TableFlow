import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import type { DiningArea } from '@/lib/dining-area-types';
import * as diningAreaService from '@/services/dining-areas';
import DiningAreasPage from '../page';

const mockAreas: DiningArea[] = [
  {
    id: 'area-1', restaurantId: 'rest-1', name: 'Main Hall', code: 'MAIN_HALL',
    description: null, displayOrder: 1, status: 'active', isReservable: true,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'area-2', restaurantId: 'rest-1', name: 'VIP Room', code: 'VIP_ROOM',
    description: 'Exclusive area', displayOrder: 2, status: 'active', isReservable: true,
    createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z',
  },
];

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/dining-areas',
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

describe('DiningAreasPage (top-level)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the page title and description', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper() });
    expect(screen.getByText('Dining Areas')).toBeInTheDocument();
    expect(screen.getByText('Configure dining areas, sections, and floor layouts')).toBeInTheDocument();
  });

  it('renders the new area button', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper() });
    expect(screen.getByText('New Area')).toBeInTheDocument();
  });

  it('renders the search input and status filter', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper() });
    expect(screen.getByLabelText('Search dining areas')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
  });

  it('renders area rows from API data', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Main Hall')).toBeInTheDocument();
    });
    expect(screen.getByText('VIP Room')).toBeInTheDocument();
  });

  it('shows total area count', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('2 areas')).toBeInTheDocument();
    });
  });

  it('filters areas by search', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Main Hall')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search dining areas');
    await userEvent.type(searchInput, 'VIP');

    expect(screen.getByText('VIP Room')).toBeInTheDocument();
    expect(screen.queryByText('Main Hall')).not.toBeInTheDocument();
  });

  it('shows empty state when no areas', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue([]);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('No dining areas found')).toBeInTheDocument();
    });
  });

  it('shows create link in empty state', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue([]);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Create your first dining area')).toBeInTheDocument();
    });
  });

  it('shows no restaurant message when no restaurant selected', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper(false) });
    expect(screen.getByText('Select a restaurant to manage dining areas')).toBeInTheDocument();
  });

  it('renders status badges', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    render(React.createElement(DiningAreasPage), { wrapper: createWrapper() });
    await waitFor(() => {
      const badges = screen.getAllByText('Active');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });
});
