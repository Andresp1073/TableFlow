import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as restaurantService from '@/services/restaurants';
import { useRestaurants, useRestaurant, useCreateRestaurant, useUpdateRestaurant } from '../use-restaurants';
import type { Restaurant, RestaurantCreateInput, RestaurantUpdateInput } from '@/lib/restaurant-types';

const mockRestaurants: Restaurant[] = [
  {
    id: '1', name: 'Restaurant A', slug: 'rest-a', legalName: null, taxId: null,
    email: null, phone: null, website: null, address: null, logoUrl: null,
    timezone: 'UTC', currency: 'USD', language: 'en', status: 'active', isActive: true,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', deletedAt: null,
  },
  {
    id: '2', name: 'Restaurant B', slug: 'rest-b', legalName: null, taxId: null,
    email: null, phone: null, website: null, address: null, logoUrl: null,
    timezone: 'UTC', currency: 'USD', language: 'en', status: 'suspended', isActive: false,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', deletedAt: null,
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

describe('useRestaurants', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches restaurant list', async () => {
    vi.spyOn(restaurantService, 'listRestaurants').mockResolvedValue({
      data: mockRestaurants,
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    const { result } = renderHook(() => useRestaurants({ page: 1, limit: 10 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.meta.total).toBe(2);
  });

  it('passes params to service', async () => {
    const spy = vi.spyOn(restaurantService, 'listRestaurants').mockResolvedValue({
      data: [], meta: { page: 1, limit: 5, total: 0, totalPages: 0 },
    });

    renderHook(() => useRestaurants({ page: 1, limit: 5, status: 'active', search: 'test' }), { wrapper: createWrapper() });

    await waitFor(() => expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 5, status: 'active', search: 'test' }),
    ));
  });
});

describe('useRestaurant', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches single restaurant', async () => {
    vi.spyOn(restaurantService, 'getRestaurant').mockResolvedValue(mockRestaurants[0]!);

    const { result } = renderHook(() => useRestaurant('1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Restaurant A');
  });

  it('does not fetch when id is undefined', () => {
    const spy = vi.spyOn(restaurantService, 'getRestaurant').mockResolvedValue(mockRestaurants[0]!);

    const { result } = renderHook(() => useRestaurant(undefined), { wrapper: createWrapper() });

    expect(spy).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);
  });
});

describe('useCreateRestaurant', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a restaurant', async () => {
    vi.spyOn(restaurantService, 'createRestaurant').mockResolvedValue(mockRestaurants[0]!);

    const { result } = renderHook(() => useCreateRestaurant(), { wrapper: createWrapper() });

    result.current.mutate({ name: 'New', slug: 'new' } as RestaurantCreateInput);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Restaurant A');
  });
});

describe('useUpdateRestaurant', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('updates a restaurant', async () => {
    const updated = { ...mockRestaurants[0]!, name: 'Updated' };
    vi.spyOn(restaurantService, 'updateRestaurant').mockResolvedValue(updated);

    const { result } = renderHook(() => useUpdateRestaurant(), { wrapper: createWrapper() });

    result.current.mutate({ id: '1', data: { name: 'Updated' } as RestaurantUpdateInput });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Updated');
  });
});

describe('restaurant schemas', () => {
  it('validates createRestaurantSchema', async () => {
    const { createRestaurantSchema } = await import('@/lib/restaurant-schemas');
    const valid = createRestaurantSchema.parse({ name: 'Test', slug: 'test' });
    expect(valid.name).toBe('Test');
    expect(valid.slug).toBe('test');
  });

  it('rejects invalid slug format', async () => {
    const { createRestaurantSchema } = await import('@/lib/restaurant-schemas');
    expect(() => createRestaurantSchema.parse({ name: 'Test', slug: 'UPPERCASE' })).toThrow();
    expect(() => createRestaurantSchema.parse({ name: 'Test', slug: 'has spaces' })).toThrow();
    expect(() => createRestaurantSchema.parse({ name: 'Test', slug: 'special!' })).toThrow();
  });

  it('validates updateRestaurantSchema allows partial', async () => {
    const { updateRestaurantSchema } = await import('@/lib/restaurant-schemas');
    const valid = updateRestaurantSchema.parse({ name: 'Updated' });
    expect(valid.name).toBe('Updated');
  });
});
