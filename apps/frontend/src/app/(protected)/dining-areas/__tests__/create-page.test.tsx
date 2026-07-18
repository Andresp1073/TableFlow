import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantProvider, useRestaurant } from '@/providers/restaurant-provider';
import CreateDiningAreaPage from '../create/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/dining-areas/create',
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

describe('CreateDiningAreaPage (top-level)', () => {
  it('renders create page title', async () => {
    render(React.createElement(CreateDiningAreaPage), { wrapper: createWrapper() });
    expect(screen.getByRole('heading', { name: 'Create Dining Area' })).toBeInTheDocument();
  });

  it('renders description', async () => {
    render(React.createElement(CreateDiningAreaPage), { wrapper: createWrapper() });
    expect(screen.getByText('Add a new dining area')).toBeInTheDocument();
  });

  it('renders back button', async () => {
    render(React.createElement(CreateDiningAreaPage), { wrapper: createWrapper() });
    expect(screen.getByText('Back to Dining Areas')).toBeInTheDocument();
  });

  it('renders form fields', async () => {
    render(React.createElement(CreateDiningAreaPage), { wrapper: createWrapper() });
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
  });

  it('renders submit button', async () => {
    render(React.createElement(CreateDiningAreaPage), { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: 'Create Dining Area' })).toBeInTheDocument();
  });

  it('shows description textarea', async () => {
    render(React.createElement(CreateDiningAreaPage), { wrapper: createWrapper() });
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('shows display order field', async () => {
    render(React.createElement(CreateDiningAreaPage), { wrapper: createWrapper() });
    expect(screen.getByText('Display Order')).toBeInTheDocument();
  });
});
