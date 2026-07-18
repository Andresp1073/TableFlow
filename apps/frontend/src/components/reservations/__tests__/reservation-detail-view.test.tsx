import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReservationDetailView } from '../reservation-detail-view';
import type { ReservationDTO } from '@/lib/reservation-types';

const mockReservation: ReservationDTO = {
  id: 'res-1',
  restaurantId: 'rest-1',
  reservationNumber: 'RES-001',
  customerId: null,
  tableId: null,
  tableGroupId: null,
  date: '2026-07-20T00:00:00',
  startTime: '2026-07-20T18:00:00',
  endTime: '2026-07-20T20:00:00',
  partySize: 4,
  status: 'confirmed',
  source: 'phone',
  notes: 'Allergic to nuts',
  specialRequests: 'Window seat preferred',
  createdBy: 'user-1',
  createdAt: '2026-07-17T00:00:00',
  updatedAt: '2026-07-17T00:00:00',
  cancelledAt: null,
};

describe('ReservationDetailView', () => {
  it('renders reservation number', () => {
    render(<ReservationDetailView reservation={mockReservation} />);
    expect(screen.getByText('RES-001')).toBeInTheDocument();
  });

  it('renders party size', () => {
    render(<ReservationDetailView reservation={mockReservation} />);
    expect(screen.getByText('4 guests')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<ReservationDetailView reservation={mockReservation} />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders source', () => {
    render(<ReservationDetailView reservation={mockReservation} />);
    expect(screen.getByText('Phone')).toBeInTheDocument();
  });

  it('renders special requests', () => {
    render(<ReservationDetailView reservation={mockReservation} />);
    expect(screen.getByText('Window seat preferred')).toBeInTheDocument();
  });

  it('renders notes', () => {
    render(<ReservationDetailView reservation={mockReservation} />);
    expect(screen.getByText('Allergic to nuts')).toBeInTheDocument();
  });

  it('renders loading skeleton', () => {
    const { container } = render(<ReservationDetailView loading />);
    expect(container.querySelectorAll('.rounded-md.bg-muted').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<ReservationDetailView error="Failed to load" />);
    expect(screen.getByText('Error loading reservation')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders time range', () => {
    render(<ReservationDetailView reservation={mockReservation} />);
    expect(screen.getByText(/\d+:\d+ (AM|PM) - \d+:\d+ (AM|PM)/)).toBeInTheDocument();
  });
});
