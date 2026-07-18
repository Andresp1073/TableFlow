import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import type { DiningArea } from '@/lib/dining-area-types';
import * as diningAreaService from '@/services/dining-areas';
import EditDiningAreaPage from '../[diningAreaId]/edit/page';

const mockArea: DiningArea = {
  id: 'area-1', restaurantId: 'rest-1', name: 'Main Hall', code: 'MAIN_HALL',
  description: 'The main dining hall', displayOrder: 1, status: 'active', isReservable: true,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ diningAreaId: 'area-1' }),
  usePathname: () => '/dining-areas/area-1/edit',
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

describe('EditDiningAreaPage (top-level)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(diningAreaService, 'getDiningArea').mockResolvedValue(mockArea);
  });

  it('renders edit page title with area name when loaded', async () => {
    render(React.createElement(EditDiningAreaPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Edit: Main Hall')).toBeInTheDocument();
    expect(screen.getByText('Update dining area information')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    render(React.createElement(EditDiningAreaPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Back to Details')).toBeInTheDocument();
  });

  it('renders form fields with existing data', async () => {
    render(React.createElement(EditDiningAreaPage), { wrapper: createWrapper() });
    expect(await screen.findByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
  });

  it('renders save button', async () => {
    render(React.createElement(EditDiningAreaPage), { wrapper: createWrapper() });
    expect(await screen.findByText('Save Changes')).toBeInTheDocument();
  });
});
