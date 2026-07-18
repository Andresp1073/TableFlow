import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReservationStatusBadge, ReservationStatusDot } from '../reservation-status-badge';
import type { ReservationStatus } from '@/lib/reservation-types';

describe('ReservationStatusBadge', () => {
  const statuses: ReservationStatus[] = [
    'pending', 'confirmed', 'checked_in', 'seated',
    'completed', 'cancelled', 'no_show',
  ];

  for (const status of statuses) {
    it(`renders ${status} status`, () => {
      render(<ReservationStatusBadge status={status} />);
      const labels: Record<ReservationStatus, string> = {
        pending: 'Pending', confirmed: 'Confirmed', checked_in: 'Checked In',
        seated: 'Seated', completed: 'Completed', cancelled: 'Cancelled',
        no_show: 'No Show',
      };
      expect(screen.getByText(labels[status])).toBeInTheDocument();
    });
  }

  it('renders with aria-label', () => {
    render(<ReservationStatusBadge status="confirmed" />);
    expect(screen.getByLabelText('Status: Confirmed')).toBeInTheDocument();
  });
});

describe('ReservationStatusDot', () => {
  it('renders status label', () => {
    render(<ReservationStatusDot status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders with aria-label', () => {
    render(<ReservationStatusDot status="completed" />);
    expect(screen.getByLabelText('Status: Completed')).toBeInTheDocument();
  });
});
