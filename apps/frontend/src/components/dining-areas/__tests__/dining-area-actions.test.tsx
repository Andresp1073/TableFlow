import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiningAreaActions } from '../dining-area-actions';
import type { DiningArea } from '@/lib/dining-area-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: 'rest-1' }),
}));

const mockArea: DiningArea = {
  id: 'area-1',
  restaurantId: 'rest-1',
  name: 'Main Hall',
  code: 'MAIN_HALL',
  description: null,
  displayOrder: 1,
  status: 'active',
  isReservable: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('DiningAreaActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edit button and actions dropdown', () => {
    renderWithQueryClient(<DiningAreaActions area={mockArea} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more actions/i })).toBeInTheDocument();
  });

  it('shows archive option for active area', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DiningAreaActions area={mockArea} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByText(/archive/i)).toBeInTheDocument();
  });

  it('opens confirmation dialog when archive clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DiningAreaActions area={mockArea} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    await user.click(screen.getByText(/archive/i));
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
  });

  it('shows disabled restore option for archived area', async () => {
    const user = userEvent.setup();
    const archivedArea: DiningArea = { ...mockArea, status: 'archived' };
    renderWithQueryClient(<DiningAreaActions area={archivedArea} />);
    await user.click(screen.getByRole('button', { name: /more actions/i }));
    expect(screen.getByText(/restore/i)).toBeInTheDocument();
  });
});
