import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as diningAreaService from '@/services/dining-areas';
import { useDiningAreas, useDiningArea, useCreateDiningArea, useUpdateDiningArea, useArchiveDiningArea } from '../use-dining-areas';
import type { DiningArea } from '@/lib/dining-area-types';

const mockAreas: DiningArea[] = [
  {
    id: '1', restaurantId: 'rest-1', name: 'Main Hall', code: 'MAIN_HALL',
    description: null, displayOrder: 1, status: 'active', isReservable: true,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2', restaurantId: 'rest-1', name: 'VIP Room', code: 'VIP_ROOM',
    description: 'Private area', displayOrder: 2, status: 'active', isReservable: true,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useDiningAreas', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('fetches dining areas list', async () => {
    vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    const { result } = renderHook(() => useDiningAreas('rest-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('does not fetch when restaurantId is undefined', () => {
    const spy = vi.spyOn(diningAreaService, 'listDiningAreas').mockResolvedValue(mockAreas);
    renderHook(() => useDiningAreas(undefined), { wrapper: createWrapper() });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useDiningArea', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('fetches single dining area', async () => {
    vi.spyOn(diningAreaService, 'getDiningArea').mockResolvedValue(mockAreas[0]!);
    const { result } = renderHook(() => useDiningArea('rest-1', '1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Main Hall');
  });

  it('does not fetch when ids are undefined', () => {
    const spy = vi.spyOn(diningAreaService, 'getDiningArea').mockResolvedValue(mockAreas[0]!);
    renderHook(() => useDiningArea(undefined, undefined), { wrapper: createWrapper() });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useCreateDiningArea', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('creates a dining area', async () => {
    vi.spyOn(diningAreaService, 'createDiningArea').mockResolvedValue(mockAreas[0]!);
    const { result } = renderHook(() => useCreateDiningArea(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', data: { name: 'New', code: 'NEW' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Main Hall');
  });
});

describe('useUpdateDiningArea', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('updates a dining area', async () => {
    const updated = { ...mockAreas[0]!, name: 'Updated Hall' };
    vi.spyOn(diningAreaService, 'updateDiningArea').mockResolvedValue(updated);
    const { result } = renderHook(() => useUpdateDiningArea(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', diningAreaId: '1', data: { name: 'Updated Hall' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Updated Hall');
  });
});

describe('useArchiveDiningArea', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('archives a dining area', async () => {
    const archived = { ...mockAreas[0]!, status: 'archived' as const };
    vi.spyOn(diningAreaService, 'archiveDiningArea').mockResolvedValue(archived);
    const { result } = renderHook(() => useArchiveDiningArea(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', diningAreaId: '1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('archived');
  });
});

describe('dining area schemas', () => {
  it('validates createDiningAreaSchema', async () => {
    const { createDiningAreaSchema } = await import('@/lib/dining-area-schemas');
    const valid = createDiningAreaSchema.parse({ name: 'Terrace', code: 'TERRACE' });
    expect(valid.name).toBe('Terrace');
    expect(valid.code).toBe('TERRACE');
  });

  it('rejects invalid code format', async () => {
    const { createDiningAreaSchema } = await import('@/lib/dining-area-schemas');
    expect(() => createDiningAreaSchema.parse({ name: 'Test', code: 'lowercase' })).toThrow();
    expect(() => createDiningAreaSchema.parse({ name: 'Test', code: '' })).toThrow();
  });

  it('rejects code with special characters at start', async () => {
    const { createDiningAreaSchema } = await import('@/lib/dining-area-schemas');
    expect(() => createDiningAreaSchema.parse({ name: 'Test', code: '-BAD' })).toThrow();
  });

  it('validates updateDiningAreaSchema allows partial', async () => {
    const { updateDiningAreaSchema } = await import('@/lib/dining-area-schemas');
    const valid = updateDiningAreaSchema.parse({ name: 'Updated' });
    expect(valid.name).toBe('Updated');
    expect(valid.code).toBeUndefined();
  });

  it('coerces displayOrder string to number', async () => {
    const { createDiningAreaSchema } = await import('@/lib/dining-area-schemas');
    const valid = createDiningAreaSchema.parse({ name: 'Test', code: 'TEST', displayOrder: '5' });
    expect(valid.displayOrder).toBe(5);
  });
});
