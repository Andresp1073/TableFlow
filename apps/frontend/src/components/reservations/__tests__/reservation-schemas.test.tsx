import { describe, it, expect } from 'vitest';
import type { ReservationStatus } from '@/lib/reservation-types';

describe('createReservationSchema', () => {
  it('validates a valid create input', async () => {
    const { createReservationSchema } = await import('@/lib/reservation-schemas');
    const valid = createReservationSchema.parse({
      reservationNumber: 'RES-001',
      date: '2026-07-20',
      startTime: '18:00',
      endTime: '20:00',
      partySize: 4,
      source: 'phone',
    });
    expect(valid.reservationNumber).toBe('RES-001');
    expect(valid.partySize).toBe(4);
    expect(valid.source).toBe('phone');
  });

  it('rejects missing required fields', async () => {
    const { createReservationSchema } = await import('@/lib/reservation-schemas');
    expect(() => createReservationSchema.parse({})).toThrow();
  });

  it('rejects party size below 1', async () => {
    const { createReservationSchema } = await import('@/lib/reservation-schemas');
    expect(() =>
      createReservationSchema.parse({
        reservationNumber: 'RES-001', date: '2026-07-20',
        startTime: '18:00', endTime: '20:00', partySize: 0, source: 'phone',
      }),
    ).toThrow();
  });

  it('rejects party size above 100', async () => {
    const { createReservationSchema } = await import('@/lib/reservation-schemas');
    expect(() =>
      createReservationSchema.parse({
        reservationNumber: 'RES-001', date: '2026-07-20',
        startTime: '18:00', endTime: '20:00', partySize: 101, source: 'phone',
      }),
    ).toThrow();
  });

  it('coerces party size string to number', async () => {
    const { createReservationSchema } = await import('@/lib/reservation-schemas');
    const valid = createReservationSchema.parse({
      reservationNumber: 'RES-001', date: '2026-07-20',
      startTime: '18:00', endTime: '20:00', partySize: '4', source: 'phone',
    });
    expect(valid.partySize).toBe(4);
  });
});

describe('updateReservationSchema', () => {
  it('allows partial update', async () => {
    const { updateReservationSchema } = await import('@/lib/reservation-schemas');
    const valid = updateReservationSchema.parse({ partySize: 6 });
    expect(valid.partySize).toBe(6);
  });

  it('allows empty object', async () => {
    const { updateReservationSchema } = await import('@/lib/reservation-schemas');
    const valid = updateReservationSchema.parse({});
    expect(Object.keys(valid as Record<string, unknown>).length).toBe(0);
  });
});

describe('reservationSearchSchema', () => {
  it('validates search with optional fields', async () => {
    const { reservationSearchSchema } = await import('@/lib/reservation-schemas');
    const valid = reservationSearchSchema.parse({
      query: 'RES-001',
      status: 'confirmed',
      minPartySize: 2,
      maxPartySize: 8,
    });
    expect(valid.query).toBe('RES-001');
    expect(valid.status).toBe('confirmed');
  });

  it('allows empty search', async () => {
    const { reservationSearchSchema } = await import('@/lib/reservation-schemas');
    const valid = reservationSearchSchema.parse({});
    expect(Object.keys(valid).length).toBe(0);
  });
});

describe('reservation types', () => {
  it('has RESERVATION_STATUS_OPTIONS with all statuses', async () => {
    const { RESERVATION_STATUS_OPTIONS } = await import('@/lib/reservation-types');
    expect(RESERVATION_STATUS_OPTIONS.length).toBe(8);
    expect(RESERVATION_STATUS_OPTIONS[0]!.value).toBe('');
  });

  it('has RESERVATION_STATUS_LABELS for all statuses', async () => {
    const { RESERVATION_STATUS_LABELS } = await import('@/lib/reservation-types');
    const statuses: ReservationStatus[] = [
      'pending', 'confirmed', 'checked_in', 'seated',
      'completed', 'cancelled', 'no_show',
    ];
    for (const s of statuses) {
      expect(RESERVATION_STATUS_LABELS[s]).toBeTruthy();
    }
  });

  it('has RESERVATION_STATUS_VARIANTS for all statuses', async () => {
    const { RESERVATION_STATUS_VARIANTS } = await import('@/lib/reservation-types');
    const statuses: ReservationStatus[] = [
      'pending', 'confirmed', 'checked_in', 'seated',
      'completed', 'cancelled', 'no_show',
    ];
    for (const s of statuses) {
      expect(RESERVATION_STATUS_VARIANTS[s]).toBeTruthy();
    }
  });

  it('has RESERVATION_SOURCE_OPTIONS', async () => {
    const { RESERVATION_SOURCE_OPTIONS } = await import('@/lib/reservation-types');
    expect(RESERVATION_SOURCE_OPTIONS.length).toBeGreaterThan(0);
  });

  it('has CALENDAR_VIEW_OPTIONS with all views', async () => {
    const { CALENDAR_VIEW_OPTIONS } = await import('@/lib/reservation-types');
    expect(CALENDAR_VIEW_OPTIONS.length).toBe(5);
  });

  it('has ACTIVE_STATUSES and TERMINAL_STATUSES', async () => {
    const { ACTIVE_STATUSES, TERMINAL_STATUSES } = await import('@/lib/reservation-types');
    expect(ACTIVE_STATUSES.length).toBe(4);
    expect(TERMINAL_STATUSES.length).toBe(3);
  });

  it('has ALLOWED_TRANSITIONS defined', async () => {
    const { ALLOWED_TRANSITIONS } = await import('@/lib/reservation-types');
    const statuses: ReservationStatus[] = [
      'pending', 'confirmed', 'checked_in', 'seated',
      'completed', 'cancelled', 'no_show',
    ];
    for (const s of statuses) {
      expect(Array.isArray(ALLOWED_TRANSITIONS[s])).toBe(true);
    }
  });
});
