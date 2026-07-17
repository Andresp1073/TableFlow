'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tableService from '@/services/tables';
import type {
  TableCreateInput,
  TableUpdateInput,
  TableListParams,
  StatusChangeInput,
} from '@/lib/table-types';

const TABLES_KEY = 'tables';
const TABLE_KEY = 'table';

export function useTables(restaurantId: string | undefined, params: TableListParams = {}) {
  return useQuery({
    queryKey: [TABLES_KEY, restaurantId, params],
    queryFn: () => tableService.listTables(restaurantId!, params),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useTable(restaurantId: string | undefined, tableId: string | undefined) {
  return useQuery({
    queryKey: [TABLE_KEY, restaurantId, tableId],
    queryFn: () => tableService.getTable(restaurantId!, tableId!),
    enabled: !!restaurantId && !!tableId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: TableCreateInput }) =>
      tableService.createTable(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, variables.restaurantId] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, tableId, data }: { restaurantId: string; tableId: string; data: TableUpdateInput }) =>
      tableService.updateTable(restaurantId, tableId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [TABLE_KEY, variables.restaurantId, variables.tableId] });
    },
  });
}

export function useUpdateTablePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, tableId, positionX, positionY }: {
      restaurantId: string;
      tableId: string;
      positionX: number;
      positionY: number;
    }) => tableService.updateTable(restaurantId, tableId, { positionX, positionY }),
    onMutate: async ({ restaurantId, tableId, positionX, positionY }) => {
      await queryClient.cancelQueries({ queryKey: [TABLES_KEY, restaurantId] });
      const previousTables = queryClient.getQueryData([TABLES_KEY, restaurantId]);
      if (previousTables) {
        queryClient.setQueryData([TABLES_KEY, restaurantId], (old: unknown) => {
          if (!old || !Array.isArray(old)) return old;
          return (old as Array<Record<string, unknown>>).map((t: Record<string, unknown>) =>
            t['id'] === tableId ? { ...t, positionX, positionY } : t,
          );
        });
      }
      return { previousTables };
    },
    onError: (_err, variables, context) => {
      if (context?.previousTables) {
        queryClient.setQueryData([TABLES_KEY, variables.restaurantId], context.previousTables);
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, variables.restaurantId] });
    },
  });
}

export function useArchiveTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, tableId }: { restaurantId: string; tableId: string }) =>
      tableService.archiveTable(restaurantId, tableId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [TABLE_KEY, variables.restaurantId, variables.tableId] });
    },
  });
}

export function useChangeTableStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, tableId, data }: {
      restaurantId: string;
      tableId: string;
      data: StatusChangeInput;
    }) => tableService.changeTableStatus(restaurantId, tableId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [TABLES_KEY, variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [TABLE_KEY, variables.restaurantId, variables.tableId] });
    },
  });
}

export function useTableTransitions(restaurantId: string | undefined, tableId: string | undefined) {
  return useQuery({
    queryKey: [TABLE_KEY, restaurantId, tableId, 'transitions'],
    queryFn: () => tableService.getTableTransitions(restaurantId!, tableId!),
    enabled: !!restaurantId && !!tableId,
    staleTime: 60_000,
    retry: 2,
  });
}
