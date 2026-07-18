import { get, post, put, patch } from './api';
import type {
  InventoryDashboardData,
  Product,
  ProductDetail,
  Category,
  Supplier,
  SupplierDetail,
  StockSummary,
  StockItem,
  StockMovement,
  PurchaseOrder,
  PurchaseOrderDetail,
  CreatePurchaseOrderInput,
  InventoryAlertsData,
  CreateProductInput,
  CreateSupplierInput,
  ReceiveStockItem,
} from '@/lib/inventory-types';

const BASE = '/restaurants';

export async function getInventoryDashboard(restaurantId: string): Promise<InventoryDashboardData> {
  const response = await get<InventoryDashboardData>(`${BASE}/${restaurantId}/inventory/dashboard`);
  return response.data;
}

export async function listProducts(
  restaurantId: string,
  params: { search?: string; category?: string; isActive?: string; page?: number; limit?: number } = {},
): Promise<Product[]> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.isActive) query.set('isActive', params.isActive);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const response = await get<Product[]>(`${BASE}/${restaurantId}/inventory/products${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function getProduct(restaurantId: string, productId: string): Promise<ProductDetail> {
  const response = await get<ProductDetail>(`${BASE}/${restaurantId}/inventory/products/${productId}`);
  return response.data;
}

export async function createProduct(restaurantId: string, data: CreateProductInput): Promise<Product> {
  const response = await post<Product>(`${BASE}/${restaurantId}/inventory/products`, data);
  return response.data;
}

export async function updateProduct(restaurantId: string, productId: string, data: Partial<CreateProductInput>): Promise<Product> {
  const response = await put<Product>(`${BASE}/${restaurantId}/inventory/products/${productId}`, data);
  return response.data;
}

export async function archiveProduct(restaurantId: string, productId: string): Promise<void> {
  await patch(`${BASE}/${restaurantId}/inventory/products/${productId}/archive`);
}

export async function restoreProduct(restaurantId: string, productId: string): Promise<void> {
  await patch(`${BASE}/${restaurantId}/inventory/products/${productId}/restore`);
}

export async function listCategories(restaurantId: string): Promise<Category[]> {
  const response = await get<Category[]>(`${BASE}/${restaurantId}/inventory/categories`);
  return response.data;
}

export async function listSuppliers(restaurantId: string): Promise<Supplier[]> {
  const response = await get<Supplier[]>(`${BASE}/${restaurantId}/inventory/suppliers`);
  return response.data;
}

export async function getSupplier(restaurantId: string, supplierId: string): Promise<SupplierDetail> {
  const response = await get<SupplierDetail>(`${BASE}/${restaurantId}/inventory/suppliers/${supplierId}`);
  return response.data;
}

export async function createSupplier(restaurantId: string, data: CreateSupplierInput): Promise<Supplier> {
  const response = await post<Supplier>(`${BASE}/${restaurantId}/inventory/suppliers`, data);
  return response.data;
}

export async function getStockSummary(restaurantId: string): Promise<StockSummary[]> {
  const response = await get<StockSummary[]>(`${BASE}/${restaurantId}/inventory/stock`);
  return response.data;
}

export async function getStockItems(restaurantId: string, ingredientId?: string): Promise<StockItem[]> {
  const query = ingredientId ? `?ingredientId=${ingredientId}` : '';
  const response = await get<StockItem[]>(`${BASE}/${restaurantId}/inventory/stock/items${query}`);
  return response.data;
}

export async function listStockMovements(
  restaurantId: string,
  params: { type?: string; ingredientId?: string; page?: number; limit?: number } = {},
): Promise<StockMovement[]> {
  const query = new URLSearchParams();
  if (params.type) query.set('type', params.type);
  if (params.ingredientId) query.set('ingredientId', params.ingredientId);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const response = await get<StockMovement[]>(`${BASE}/${restaurantId}/inventory/stock-movements${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function listPurchaseOrders(
  restaurantId: string,
  params: { status?: string; supplierId?: string; page?: number; limit?: number } = {},
): Promise<PurchaseOrder[]> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.supplierId) query.set('supplierId', params.supplierId);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const response = await get<PurchaseOrder[]>(`${BASE}/${restaurantId}/inventory/purchase-orders${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function getPurchaseOrder(restaurantId: string, orderId: string): Promise<PurchaseOrderDetail> {
  const response = await get<PurchaseOrderDetail>(`${BASE}/${restaurantId}/inventory/purchase-orders/${orderId}`);
  return response.data;
}

export async function createPurchaseOrder(restaurantId: string, data: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  const response = await post<PurchaseOrder>(`${BASE}/${restaurantId}/inventory/purchase-orders`, data);
  return response.data;
}

export async function submitPurchaseOrder(restaurantId: string, orderId: string): Promise<PurchaseOrder> {
  const response = await patch<PurchaseOrder>(`${BASE}/${restaurantId}/inventory/purchase-orders/${orderId}/submit`);
  return response.data;
}

export async function approvePurchaseOrder(restaurantId: string, orderId: string): Promise<PurchaseOrder> {
  const response = await patch<PurchaseOrder>(`${BASE}/${restaurantId}/inventory/purchase-orders/${orderId}/approve`);
  return response.data;
}

export async function receivePurchaseOrder(restaurantId: string, orderId: string, receivedItems: { ingredientId: string; quantity: number }[]): Promise<PurchaseOrder> {
  const response = await post<PurchaseOrder>(`${BASE}/${restaurantId}/inventory/purchase-orders/${orderId}/receive`, { receivedItems });
  return response.data;
}

export async function cancelPurchaseOrder(restaurantId: string, orderId: string, reason?: string): Promise<PurchaseOrder> {
  const response = await patch<PurchaseOrder>(`${BASE}/${restaurantId}/inventory/purchase-orders/${orderId}/cancel`, { reason });
  return response.data;
}

export async function receiveStock(restaurantId: string, items: ReceiveStockItem[], notes?: string): Promise<{ received: number; items: unknown[]; notes: string | null }> {
  const response = await post<{ received: number; items: unknown[]; notes: string | null }>(
    `${BASE}/${restaurantId}/inventory/receiving`, { items, notes },
  );
  return response.data;
}

export async function getInventoryAlerts(restaurantId: string): Promise<InventoryAlertsData> {
  const response = await get<InventoryAlertsData>(`${BASE}/${restaurantId}/inventory/alerts`);
  return response.data;
}
