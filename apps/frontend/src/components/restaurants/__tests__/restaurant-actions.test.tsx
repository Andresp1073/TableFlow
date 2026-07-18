import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestaurantActions } from '../restaurant-actions';
import type { Restaurant } from '@/lib/restaurant-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockRestaurant: Restaurant = {
  id: '1',
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  legalName: null,
  taxId: null,
  email: null,
  phone: null,
  website: null,
  address: null,
  logoUrl: null,
  timezone: 'America/New_York',
  currency: 'USD',
  language: 'en',
  status: 'active',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('RestaurantActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edit button and actions dropdown', () => {
    renderWithQueryClient(<RestaurantActions restaurant={mockRestaurant} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more actions/i })).toBeInTheDocument();
  });

  it('shows suspend option for active restaurant', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RestaurantActions restaurant={mockRestaurant} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByText(/suspend/i)).toBeInTheDocument();
  });

  it('shows activate option for non-active restaurant', async () => {
    const user = userEvent.setup();
    const suspendedRestaurant: Restaurant = { ...mockRestaurant, status: 'suspended', isActive: false };
    renderWithQueryClient(<RestaurantActions restaurant={suspendedRestaurant} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByText(/activate/i)).toBeInTheDocument();
  });

  it('shows archive option in dropdown', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RestaurantActions restaurant={mockRestaurant} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByText(/archive/i)).toBeInTheDocument();
  });

  it('opens confirmation dialog when suspend clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<RestaurantActions restaurant={mockRestaurant} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    await user.click(screen.getByText(/suspend/i));
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });
});
