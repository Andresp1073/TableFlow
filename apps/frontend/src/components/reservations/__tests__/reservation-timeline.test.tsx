import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReservationTimeline } from '../reservation-timeline';
import type { ReservationSummary } from '@/lib/reservation-types';

const mockReservations: ReservationSummary[] = [
  {
    id: 'res-1',
    restaurantId: 'rest-1',
    reservationNumber: 'RES-001',
    customerId: null,
    date: '2026-07-20',
    startTime: '2026-07-20T18:00:00',
    endTime: '2026-07-20T20:00:00',
    partySize: 4,
    status: 'confirmed',
    source: 'phone',
    createdAt: '2026-07-17T00:00:00',
  },
  {
    id: 'res-2',
    restaurantId: 'rest-1',
    reservationNumber: 'RES-002',
    customerId: null,
    date: '2026-07-20',
    startTime: '2026-07-20T19:00:00',
    endTime: '2026-07-20T21:00:00',
    partySize: 2,
    status: 'pending',
    source: 'online',
    createdAt: '2026-07-17T00:00:00',
  },
];

describe('ReservationTimeline', () => {
  it('renders reservation blocks', () => {
    render(
      <ReservationTimeline
        reservations={mockReservations}
        date="2026-07-20"
      />,
    );
    expect(screen.getByText('RES-001')).toBeInTheDocument();
    expect(screen.getByText('RES-002')).toBeInTheDocument();
  });

  it('renders party sizes', () => {
    render(
      <ReservationTimeline
        reservations={mockReservations}
        date="2026-07-20"
      />,
    );
    expect(screen.getByText('4 guests')).toBeInTheDocument();
    expect(screen.getByText('2 guests')).toBeInTheDocument();
  });

  it('shows empty state when no reservations', () => {
    render(
      <ReservationTimeline
        reservations={[]}
        date="2026-07-20"
      />,
    );
    expect(screen.getByText(/no reservations for this date/i)).toBeInTheDocument();
  });

  it('renders reservation blocks with accessible labels', () => {
    render(
      <ReservationTimeline
        reservations={mockReservations}
        date="2026-07-20"
        onReservationClick={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0]).toHaveAttribute('aria-label');
  });
});
