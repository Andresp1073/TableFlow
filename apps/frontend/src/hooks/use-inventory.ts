'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as inventoryService from '@/services/inventory';
import type {
  CreateProductInput,
  CreateSupplierInput,
  CreatePurchaseOrderInput,
  ReceiveStockItem,
} from '@/lib/inventory-types';

const INVENTORY_KEY = 'inventory';

export function useInventoryDashboard(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'dashboard', restaurantId],
    queryFn: () => inventoryService.getInventoryDashboard(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
    refetchInterval: 60_000,
  });
}

export function useProducts(restaurantId: string | undefined, params: { search?: string; category?: string; isActive?: string } = {}) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'products', restaurantId, params],
    queryFn: () => inventoryService.listProducts(restaurantId!, params),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useProduct(restaurantId: string | undefined, productId: string | undefined) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'product', restaurantId, productId],
    queryFn: () => inventoryService.getProduct(restaurantId!, productId!),
    enabled: !!restaurantId && !!productId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: CreateProductInput }) =>
      inventoryService.createProduct(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'products', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, productId, data }: { restaurantId: string; productId: string; data: Partial<CreateProductInput> }) =>
      inventoryService.updateProduct(restaurantId, productId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'products', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'product', variables.restaurantId, variables.productId] });
    },
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, productId }: { restaurantId: string; productId: string }) =>
      inventoryService.archiveProduct(restaurantId, productId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'products', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useRestoreProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, productId }: { restaurantId: string; productId: string }) =>
      inventoryService.restoreProduct(restaurantId, productId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'products', variables.restaurantId] });
    },
  });
}

export function useCategories(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'categories', restaurantId],
    queryFn: () => inventoryService.listCategories(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 60_000,
    retry: 2,
  });
}

export function useSuppliers(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'suppliers', restaurantId],
    queryFn: () => inventoryService.listSuppliers(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useSupplier(restaurantId: string | undefined, supplierId: string | undefined) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'supplier', restaurantId, supplierId],
    queryFn: () => inventoryService.getSupplier(restaurantId!, supplierId!),
    enabled: !!restaurantId && !!supplierId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: CreateSupplierInput }) =>
      inventoryService.createSupplier(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'suppliers', variables.restaurantId] });
    },
  });
}

export function useStockSummary(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'stock', restaurantId],
    queryFn: () => inventoryService.getStockSummary(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useStockItems(restaurantId: string | undefined, ingredientId?: string) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'stock-items', restaurantId, ingredientId],
    queryFn: () => inventoryService.getStockItems(restaurantId!, ingredientId),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useStockMovements(restaurantId: string | undefined, params: { type?: string; ingredientId?: string; page?: number } = {}) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'movements', restaurantId, params],
    queryFn: () => inventoryService.listStockMovements(restaurantId!, params),
    enabled: !!restaurantId,
    staleTime: 15_000,
    retry: 2,
  });
}

export function usePurchaseOrders(restaurantId: string | undefined, params: { status?: string; supplierId?: string; page?: number } = {}) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'purchase-orders', restaurantId, params],
    queryFn: () => inventoryService.listPurchaseOrders(restaurantId!, params),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function usePurchaseOrder(restaurantId: string | undefined, orderId: string | undefined) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'purchase-order', restaurantId, orderId],
    queryFn: () => inventoryService.getPurchaseOrder(restaurantId!, orderId!),
    enabled: !!restaurantId && !!orderId,
    staleTime: 30_000,
    retry: 2,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: CreatePurchaseOrderInput }) =>
      inventoryService.createPurchaseOrder(restaurantId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'purchase-orders', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useSubmitPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, orderId }: { restaurantId: string; orderId: string }) =>
      inventoryService.submitPurchaseOrder(restaurantId, orderId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'purchase-orders', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'purchase-order', variables.restaurantId, variables.orderId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, orderId }: { restaurantId: string; orderId: string }) =>
      inventoryService.approvePurchaseOrder(restaurantId, orderId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'purchase-orders', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'purchase-order', variables.restaurantId, variables.orderId] });
    },
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, orderId, receivedItems }: { restaurantId: string; orderId: string; receivedItems: { ingredientId: string; quantity: number }[] }) =>
      inventoryService.receivePurchaseOrder(restaurantId, orderId, receivedItems),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'purchase-orders', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'purchase-order', variables.restaurantId, variables.orderId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'stock', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, orderId, reason }: { restaurantId: string; orderId: string; reason?: string }) =>
      inventoryService.cancelPurchaseOrder(restaurantId, orderId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'purchase-orders', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'purchase-order', variables.restaurantId, variables.orderId] });
    },
  });
}

export function useReceiveStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, items, notes }: { restaurantId: string; items: ReceiveStockItem[]; notes?: string }) =>
      inventoryService.receiveStock(restaurantId, items, notes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'stock', variables.restaurantId] });
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY, 'dashboard', variables.restaurantId] });
    },
  });
}

export function useInventoryAlerts(restaurantId: string | undefined) {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'alerts', restaurantId],
    queryFn: () => inventoryService.getInventoryAlerts(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 30_000,
    retry: 2,
    refetchInterval: 120_000,
  });
}
