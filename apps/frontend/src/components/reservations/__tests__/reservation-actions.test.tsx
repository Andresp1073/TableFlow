import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReservationActions } from '../reservation-actions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({ id: 'rest-1' }),
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('ReservationActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders actions dropdown button', () => {
    renderWithQueryClient(
      <ReservationActions restaurantId="rest-1" reservationId="res-1" currentStatus="pending" />,
    );
    expect(screen.getByRole('button', { name: /reservation actions/i })).toBeInTheDocument();
  });

  it('shows expected actions for pending status', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ReservationActions restaurantId="rest-1" reservationId="res-1" currentStatus="pending" />,
    );
    await user.click(screen.getByRole('button', { name: /reservation actions/i }));
    expect(screen.getByText(/confirm/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    expect(screen.getByText(/edit/i)).toBeInTheDocument();
  });

  it('shows expected actions for confirmed status', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ReservationActions restaurantId="rest-1" reservationId="res-1" currentStatus="confirmed" />,
    );
    await user.click(screen.getByRole('button', { name: /reservation actions/i }));
    expect(screen.getByText(/check in/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  it('shows expected actions for checked_in status', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ReservationActions restaurantId="rest-1" reservationId="res-1" currentStatus="checked_in" />,
    );
    await user.click(screen.getByRole('button', { name: /reservation actions/i }));
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
  });

  it('shows complete for seated status', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ReservationActions restaurantId="rest-1" reservationId="res-1" currentStatus="seated" />,
    );
    await user.click(screen.getByRole('button', { name: /reservation actions/i }));
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  });

  it('does not render for terminal statuses', () => {
    const { container } = renderWithQueryClient(
      <ReservationActions restaurantId="rest-1" reservationId="res-1" currentStatus="completed" />,
    );
    expect(container.textContent).toBe('');
  });

  it('opens confirmation dialog when action clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ReservationActions restaurantId="rest-1" reservationId="res-1" currentStatus="pending" />,
    );
    await user.click(screen.getByRole('button', { name: /reservation actions/i }));
    await user.click(screen.getByText(/cancel/i));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('has edit reservation in dropdown', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ReservationActions restaurantId="rest-1" reservationId="res-1" currentStatus="pending" />,
    );
    await user.click(screen.getByRole('button', { name: /reservation actions/i }));
    expect(screen.getByText(/edit reservation/i)).toBeInTheDocument();
  });
});
