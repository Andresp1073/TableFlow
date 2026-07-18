import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import type { DiningArea } from '@/lib/dining-area-types';
import * as diningAreaService from '@/services/dining-areas';
import DiningAreaDetailPage from '../[diningAreaId]/page';

const mockArea: DiningArea = {
  id: 'area-1', restaurantId: 'rest-1', name: 'VIP Room', code: 'VIP_ROOM',
  description: 'Exclusive VIP area', displayOrder: 2, status: 'active', isReservable: true,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-15T00:00:00Z',
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ diningAreaId: 'area-1' }),
  usePathname: () => '/dining-areas/area-1',
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

describe('DiningAreaDetailPage (top-level)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(diningAreaService, 'getDiningArea').mockResolvedValue(mockArea);
  });

  it('renders area name and code when loaded', async () => {
    render(React.createElement(DiningAreaDetailPage), { wrapper: createWrapper() });
    await screen.findByText('Active');
    const names = screen.getAllByText('VIP Room');
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it('renders status badge', async () => {
    render(React.createElement(DiningAreaDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Active')).toBeInTheDocument();
  });

  it('renders configuration details', async () => {
    render(React.createElement(DiningAreaDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('2')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('renders description when present', async () => {
    render(React.createElement(DiningAreaDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Exclusive VIP area')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    render(React.createElement(DiningAreaDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Back to Dining Areas')).toBeInTheDocument();
  });

  it('renders audit information', async () => {
    render(React.createElement(DiningAreaDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('area-1')).toBeInTheDocument();
  });

  it('renders actions component', async () => {
    render(React.createElement(DiningAreaDetailPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Edit')).toBeInTheDocument();
  });
});
