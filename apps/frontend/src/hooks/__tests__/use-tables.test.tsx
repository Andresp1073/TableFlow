import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as tableService from '@/services/tables';
import {
  useTables,
  useTable,
  useCreateTable,
  useUpdateTable,
  useArchiveTable,
  useChangeTableStatus,
  useUpdateTablePosition,
} from '../use-tables';
import type { RestaurantTable } from '@/lib/table-types';

const mockTables: RestaurantTable[] = [
  {
    id: '1', restaurantId: 'rest-1', branchId: 'branch-1',
    diningAreaId: null, tableTypeId: null, tableNumber: 'T01',
    name: null, description: null, minimumCapacity: 2, maximumCapacity: 4,
    currentCapacity: 0, shape: 'rectangle', width: 60, height: 60,
    positionX: null, positionY: null, rotation: null, qrIdentifier: null,
    isReservable: true, isAccessible: true, isActive: true,
    status: 'available', metadata: null,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
    deletedAt: null,
  },
  {
    id: '2', restaurantId: 'rest-1', branchId: 'branch-1',
    diningAreaId: null, tableTypeId: null, tableNumber: 'T02',
    name: 'VIP Table', description: 'Premium seating', minimumCapacity: 2,
    maximumCapacity: 6, currentCapacity: 0, shape: 'round', width: 50,
    height: 50, positionX: 100, positionY: 200, rotation: 0, qrIdentifier: null,
    isReservable: true, isAccessible: false, isActive: true,
    status: 'occupied', metadata: null,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
    deletedAt: null,
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

describe('useTables', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('fetches tables list', async () => {
    vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    const { result } = renderHook(() => useTables('rest-1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });

  it('does not fetch when restaurantId is undefined', () => {
    const spy = vi.spyOn(tableService, 'listTables').mockResolvedValue(mockTables);
    renderHook(() => useTables(undefined), { wrapper: createWrapper() });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useTable', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('fetches single table', async () => {
    vi.spyOn(tableService, 'getTable').mockResolvedValue(mockTables[0]!);
    const { result } = renderHook(() => useTable('rest-1', '1'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tableNumber).toBe('T01');
  });

  it('does not fetch when ids are undefined', () => {
    const spy = vi.spyOn(tableService, 'getTable').mockResolvedValue(mockTables[0]!);
    renderHook(() => useTable(undefined, undefined), { wrapper: createWrapper() });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('useCreateTable', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('creates a table', async () => {
    vi.spyOn(tableService, 'createTable').mockResolvedValue(mockTables[0]!);
    const { result } = renderHook(() => useCreateTable(), { wrapper: createWrapper() });
    result.current.mutate({
      restaurantId: 'rest-1',
      data: { branchId: 'branch-1', tableNumber: 'T03', minimumCapacity: 2, maximumCapacity: 4 },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tableNumber).toBe('T01');
  });
});

describe('useUpdateTable', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('updates a table', async () => {
    const updated = { ...mockTables[0]!, tableNumber: 'T99' };
    vi.spyOn(tableService, 'updateTable').mockResolvedValue(updated);
    const { result } = renderHook(() => useUpdateTable(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', tableId: '1', data: { tableNumber: 'T99' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.tableNumber).toBe('T99');
  });
});

describe('useArchiveTable', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('archives a table', async () => {
    const archived = { ...mockTables[0]!, isActive: false, status: 'out_of_service' as const };
    vi.spyOn(tableService, 'archiveTable').mockResolvedValue(archived);
    const { result } = renderHook(() => useArchiveTable(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', tableId: '1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.isActive).toBe(false);
  });
});

describe('useChangeTableStatus', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('changes table status', async () => {
    vi.spyOn(tableService, 'changeTableStatus').mockResolvedValue({
      id: '1', tableNumber: 'T01', previousStatus: 'available', newStatus: 'occupied', updatedAt: new Date().toISOString(),
    });
    const { result } = renderHook(() => useChangeTableStatus(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', tableId: '1', data: { status: 'occupied' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.newStatus).toBe('occupied');
  });
});

describe('useUpdateTablePosition', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('updates table position with optimistic update', async () => {
    vi.spyOn(tableService, 'updateTable').mockResolvedValue(mockTables[0]!);
    const { result } = renderHook(() => useUpdateTablePosition(), { wrapper: createWrapper() });
    result.current.mutate({ restaurantId: 'rest-1', tableId: '1', positionX: 200, positionY: 300 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('table schemas', () => {
  it('validates createTableSchema', async () => {
    const { createTableSchema } = await import('@/lib/table-schemas');
    const valid = createTableSchema.parse({
      branchId: 'branch-1',
      tableNumber: 'T01',
      minimumCapacity: 2,
      maximumCapacity: 4,
    });
    expect(valid.tableNumber).toBe('T01');
  });

  it('rejects invalid table number format', async () => {
    const { createTableSchema } = await import('@/lib/table-schemas');
    expect(() => createTableSchema.parse({
      branchId: 'branch-1', tableNumber: '', minimumCapacity: 2, maximumCapacity: 4,
    })).toThrow();
  });

  it('validates updateTableSchema allows partial', async () => {
    const { updateTableSchema } = await import('@/lib/table-schemas');
    const valid = updateTableSchema.parse({ tableNumber: 'T99' });
    expect(valid.tableNumber).toBe('T99');
    expect(valid.branchId).toBeUndefined();
  });

  it('rejects capacity where max < min', async () => {
    const { createTableSchema } = await import('@/lib/table-schemas');
    expect(() => createTableSchema.parse({
      branchId: 'branch-1', tableNumber: 'T01', minimumCapacity: 6, maximumCapacity: 2,
    })).toThrow();
  });

  it('validates statusChangeSchema', async () => {
    const { statusChangeSchema } = await import('@/lib/table-schemas');
    const valid = statusChangeSchema.parse({ status: 'occupied' });
    expect(valid.status).toBe('occupied');
  });

  it('rejects invalid status in statusChangeSchema', async () => {
    const { statusChangeSchema } = await import('@/lib/table-schemas');
    expect(() => statusChangeSchema.parse({ status: 'invalid' })).toThrow();
  });

  it('coerces capacity strings to numbers', async () => {
    const { createTableSchema } = await import('@/lib/table-schemas');
    const valid = createTableSchema.parse({
      branchId: 'branch-1', tableNumber: 'T01', minimumCapacity: '2', maximumCapacity: '4',
    });
    expect(valid.minimumCapacity).toBe(2);
    expect(valid.maximumCapacity).toBe(4);
  });
});

describe('table types', () => {
  it('has TABLE_STATUS_OPTIONS with all statuses', async () => {
    const { TABLE_STATUS_OPTIONS } = await import('@/lib/table-types');
    expect(TABLE_STATUS_OPTIONS.length).toBe(8);
    expect(TABLE_STATUS_OPTIONS[0]!.value).toBe('');
  });

  it('has TABLE_STATUS_COLORS for all statuses', async () => {
    const { TABLE_STATUS_COLORS } = await import('@/lib/table-types');
    expect(TABLE_STATUS_COLORS.available).toBeTruthy();
    expect(TABLE_STATUS_COLORS.occupied).toBeTruthy();
    expect(TABLE_STATUS_COLORS.reserved).toBeTruthy();
    expect(TABLE_STATUS_COLORS.archived).toBeTruthy();
  });

  it('has TABLE_SHAPE_OPTIONS with all shapes', async () => {
    const { TABLE_SHAPE_OPTIONS } = await import('@/lib/table-types');
    expect(TABLE_SHAPE_OPTIONS.length).toBe(4);
  });
});
