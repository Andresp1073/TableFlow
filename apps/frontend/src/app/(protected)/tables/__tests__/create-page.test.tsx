import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import CreateTablePage from '../create/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/tables/create',
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

describe('CreateTablePage (top-level)', () => {
  it('renders create page title', async () => {
    render(React.createElement(CreateTablePage), { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'Create Table' })).toBeInTheDocument();
  });

  it('renders description', async () => {
    render(React.createElement(CreateTablePage), { wrapper: createWrapper() });
    expect(screen.getByText('Add a new table to the floor plan')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    render(React.createElement(CreateTablePage), { wrapper: createWrapper() });
    expect(screen.getByText('Back to Tables')).toBeInTheDocument();
  });

  it('renders form fields', async () => {
    render(React.createElement(CreateTablePage), { wrapper: createWrapper() });
    expect(screen.getByLabelText('Table Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Table shape')).toBeInTheDocument();
  });

  it('renders capacity fields', async () => {
    render(React.createElement(CreateTablePage), { wrapper: createWrapper() });
    expect(screen.getByText('Min Capacity')).toBeInTheDocument();
    expect(screen.getByText('Max Capacity')).toBeInTheDocument();
  });

  it('renders submit button', async () => {
    render(React.createElement(CreateTablePage), { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: 'Create Table' })).toBeInTheDocument();
  });

  it('renders checkbox labels', async () => {
    render(React.createElement(CreateTablePage), { wrapper: createWrapper() });
    expect(screen.getByText('Reservable')).toBeInTheDocument();
    expect(screen.getByText('Wheelchair Accessible')).toBeInTheDocument();
  });
});
