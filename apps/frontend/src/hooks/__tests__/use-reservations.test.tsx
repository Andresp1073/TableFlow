import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as reservationService from '@/services/reservations';
import {
  useReservations,
  useReservation,
  useCreateReservation,
  useUpdateReservation,
  useCancelReservation,
  useConfirmReservation,
  useCheckInReservation,
  useCompleteReservation,
} from '../use-reservations';
import type { ReservationSummary, ReservationDTO } from '@/lib/reservation-types';

const mockSummaries: ReservationSummary[] = [
  {
    id: '1', restaurantId: 'rest-1', reservationNumber: 'RES-001',
    customerId: null, date: '2026-07-20', startTime: '2026-07-20T18:00:00',
    endTime: '2026-07-20T20:00:00', partySize: 4, status: 'confirmed',
    source: 'phone', createdAt: '2026-07-17T00:00:00',
  },
  {
    id: '2', restaurantId: 'rest-1', reservationNumber: 'RES-002',
    customerId: null, date: '2026-07-20', startTime: '2026-07-20T19:00:00',
    endTime: '2026-07-20T21:00:00', partySize: 2, status: 'pending',
    source: 'online', createdAt: '2026-07-17T00:00:00',
  },
];

const mockDTO: ReservationDTO = {
  id: '1', restaurantId: 'rest-1', reservationNumber: 'RES-001',
  customerId: null, tableId: null, tableGroupId: null,
  date: '2026-07-20', startTime: '2026-07-20T18:00:00',
  endTime: '2026-07-20T20:00:00', partySize: 4, status: 'confirmed',
  source: 'phone', notes: null, specialRequests: null,
  createdBy: 'user-1', createdAt: '2026-07-17T00:00:00',
  updatedAt: '2026-07-17T00:00:00', cancelledAt: null,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useReservations', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('fetches reservations list', async () => {
    vi.spyOn(reservationService, 'listReservations').mockResolvedValue(mockSummaries);
    const { result } = renderHook(() => useReservations('rest-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('does not fetch when restaurantId is undefined', () => {
    const spy = vi.spyOn(reservationService, 'listReservations').mockResolvedValue(mockSummaries);
    renderHook(() => useReservations(undefined), { wrapper: createWrapper() });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useReservation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('fetches single reservation', async () => {
    vi.spyOn(reservationService, 'getReservation').mockResolvedValue(mockDTO);
    const { result } = renderHook(() => useReservation('rest-1', '1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.reservationNumber).toBe('RES-001');
  });

  it('does not fetch when ids are undefined', () => {
    const spy = vi.spyOn(reservationService, 'getReservation').mockResolvedValue(mockDTO);
    renderHook(() => useReservation(undefined, undefined), { wrapper: createWrapper() });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useCreateReservation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('creates a reservation', async () => {
    vi.spyOn(reservationService, 'createReservation').mockResolvedValue(mockDTO);
    const { result } = renderHook(() => useCreateReservation(), { wrapper: createWrapper() });
    result.current.mutate({
      restaurantId: 'rest-1',
      data: {
        reservationNumber: 'RES-003', date: '2026-07-20',
        startTime: '2026-07-20T18:00:00', endTime: '2026-07-20T20:00:00',
        partySize: 4, source: 'phone',
      },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.reservationNumber).toBe('RES-001');
  });
});

describe('useUpdateReservation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('updates a reservation', async () => {
    const updated = { ...mockDTO, partySize: 6 };
    vi.spyOn(reservationService, 'updateReservation').mockResolvedValue(updated);
    const { result } = renderHook(() => useUpdateReservation(), { wrapper: createWrapper() });
    result.current.mutate({
      restaurantId: 'rest-1', reservationId: '1', data: { partySize: 6 },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.partySize).toBe(6);
  });
});

describe('useCancelReservation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('cancels a reservation', async () => {
    const cancelled = { ...mockDTO, status: 'cancelled' as const };
    vi.spyOn(reservationService, 'cancelReservation').mockResolvedValue(cancelled);
    const { result } = renderHook(() => useCancelReservation(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', reservationId: '1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('cancelled');
  });
});

describe('useConfirmReservation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('confirms a reservation', async () => {
    const confirmed = { ...mockDTO, status: 'confirmed' as const };
    vi.spyOn(reservationService, 'confirmReservation').mockResolvedValue(confirmed);
    const { result } = renderHook(() => useConfirmReservation(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', reservationId: '1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('confirmed');
  });
});

describe('useCheckInReservation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('checks in a reservation', async () => {
    const checkedIn = { ...mockDTO, status: 'checked_in' as const };
    vi.spyOn(reservationService, 'checkInReservation').mockResolvedValue(checkedIn);
    const { result } = renderHook(() => useCheckInReservation(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', reservationId: '1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('checked_in');
  });
});

describe('useCompleteReservation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('completes a reservation', async () => {
    const completed = { ...mockDTO, status: 'completed' as const };
    vi.spyOn(reservationService, 'completeReservation').mockResolvedValue(completed);
    const { result } = renderHook(() => useCompleteReservation(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', reservationId: '1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('completed');
  });
});
