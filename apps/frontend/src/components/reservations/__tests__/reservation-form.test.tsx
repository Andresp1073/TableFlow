import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReservationForm } from '../reservation-form';
import type { ReservationDTO } from '@/lib/reservation-types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: 'rest-1' }),
}));

const mockReservation: ReservationDTO = {
  id: 'res-1',
  restaurantId: 'rest-1',
  reservationNumber: 'RES-001',
  customerId: null,
  tableId: null,
  tableGroupId: null,
  date: '2026-07-20',
  startTime: '2026-07-20T18:00:00',
  endTime: '2026-07-20T20:00:00',
  partySize: 4,
  status: 'confirmed',
  source: 'phone',
  notes: 'Allergic to nuts',
  specialRequests: null,
  createdBy: 'user-1',
  createdAt: '2026-07-17T00:00:00',
  updatedAt: '2026-07-17T00:00:00',
  cancelledAt: null,
};

describe('ReservationForm', () => {
  it('renders create form with required fields', () => {
    render(
      <ReservationForm mode="create" onSubmit={vi.fn()} />,
    );
    expect(screen.getByLabelText(/reservation number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/party size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument();
  });

  it('renders submit button with create text', () => {
    render(
      <ReservationForm mode="create" onSubmit={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /create reservation/i })).toBeInTheDocument();
  });

  it('renders edit form with save text', () => {
    render(
      <ReservationForm mode="edit" initialData={mockReservation} onSubmit={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('pre-fills form with initial data in edit mode', () => {
    render(
      <ReservationForm mode="edit" initialData={mockReservation} onSubmit={vi.fn()} />,
    );
    const numberInput = screen.getByLabelText(/reservation number/i) as HTMLInputElement;
    expect(numberInput.value).toBe('RES-001');
  });

  it('shows loading state', () => {
    render(
      <ReservationForm mode="create" isLoading onSubmit={vi.fn()} />,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('shows error alert', () => {
    render(
      <ReservationForm mode="create" error="Something went wrong" onSubmit={vi.fn()} />,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has submit button that is enabled by default', () => {
    render(
      <ReservationForm mode="create" onSubmit={vi.fn()} />,
    );
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });
});
