export type IngredientCategory = 'RawMaterial' | 'Prepared' | 'FinishedProduct' | 'Consumable' | 'Packaging';
export type IngredientUnit = 'Kg' | 'G' | 'L' | 'Ml' | 'Units' | 'Pieces' | 'Boxes' | 'Cases' | 'Bags';
export type StockMovementType = 'Purchase' | 'Consumption' | 'Adjustment' | 'Waste' | 'Return' | 'Transfer';
export type PurchaseOrderStatus = 'Draft' | 'Submitted' | 'Approved' | 'Received' | 'Cancelled';
export type SupplierStatus = 'Active' | 'Inactive' | 'Suspended';

export interface Product {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: IngredientUnit;
  costPerUnit: number;
  currentStock: number;
  isActive: boolean;
  sku: string | null;
  preferredSupplierId: string | null;
  perishable: boolean;
  shelfLifeDays: number | null;
  storageInstructions?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  stockItems: StockItemDetail[];
}

export interface StockItemDetail {
  id: string;
  quantity: number;
  unit: IngredientUnit;
  batchCode: string | null;
  location: string | null;
  receivedAt: string;
  expiresAt: string | null;
  costAtReceipt: number;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
  activeCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address?: string | null;
  status: SupplierStatus;
  leadTimeDays: number;
  minimumOrderAmount: number;
  preferred: boolean;
  paymentTerms?: string | null;
  notes?: string | null;
  productCount?: number;
}

export interface SupplierDetail extends Supplier {
  products: SupplierProduct[];
  purchaseOrders: SupplierPurchaseOrder[];
}

export interface SupplierProduct {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
}

export interface SupplierPurchaseOrder {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface StockSummary {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  maximumStock: number;
  costPerUnit: number;
  totalValue: number;
  batchCount: number;
  isLowStock: boolean;
  isOverstock: boolean;
}

export interface StockItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
  location: string | null;
  batchCode: string | null;
  receivedAt: string;
  expiresAt: string | null;
  costAtReceipt: number;
  isLowStock: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: StockMovementType;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  reason: string | null;
  performedBy: string;
  createdAt: string;
  isIncrease: boolean;
  isDecrease: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  itemCount: number;
  receivedCount: number;
  isFullyReceived: boolean;
  notes?: string;
  orderedAt: string | null;
  expectedDeliveryAt: string | null;
  receivedAt: string | null;
  createdBy: string;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  items: PurchaseOrderLineItem[];
  outstandingItems: PurchaseOrderLineItem[];
  canTransitionTo: string[];
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  supplierName: string;
  items: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    unitCost: number;
  }[];
  notes?: string;
  createdBy: string;
  expectedDeliveryAt?: string;
}

export interface ReceiveOrderItem {
  ingredientId: string;
  quantity: number;
  unit: string;
  unitCost?: number;
}

export interface ReceiveStockItem {
  ingredientId: string;
  quantity: number;
  unit: string;
  costAtReceipt?: number;
  batchCode?: string;
  location?: string;
  expiresAt?: string;
  purchaseOrderId?: string;
}

export interface InventoryDashboardData {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingOrderCount: number;
  lowStockProducts: { id: string; name: string; currentStock: number; unit: string; category: string }[];
  outOfStockProducts: { id: string; name: string; unit: string }[];
  pendingOrders: {
    id: string; supplierName: string; totalAmount: number;
    status: string; itemCount: number; orderedAt: string | null; expectedDeliveryAt: string | null;
  }[];
  recentMovements: {
    id: string; ingredientName: string; type: string;
    quantity: number; unit: string; createdAt: string;
  }[];
  topConsumed: { name: string; quantity: number }[];
  stockSummary: unknown[];
}

export interface InventoryAlert {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  category?: string;
}

export interface InventoryAlertsData {
  lowStock: InventoryAlert[];
  outOfStock: { id: string; name: string; unit: string }[];
  expired: {
    id: string; ingredientId: string; ingredientName: string;
    quantity: number; unit: string; batchCode: string | null; expiresAt: string | null;
  }[];
  expiringSoon: {
    id: string; ingredientId: string; ingredientName: string;
    quantity: number; unit: string; expiresAt: string | null; daysUntilExpiry: number | null;
  }[];
  pendingReceiving: {
    id: string; supplierName: string; status: string;
    itemCount: number; totalAmount: number; expectedDeliveryAt: string | null;
  }[];
  totalLowStock: number;
  totalOutOfStock: number;
  totalExpired: number;
  totalExpiringSoon: number;
  totalPendingReceiving: number;
}

export interface CreateProductInput {
  name: string;
  category?: IngredientCategory;
  unit?: IngredientUnit;
  costPerUnit?: number;
  sku?: string;
  preferredSupplierId?: string;
  perishable?: boolean;
  shelfLifeDays?: number;
  storageInstructions?: string;
}

export interface CreateCategoryInput {
  name: string;
}

export interface CreateSupplierInput {
  id?: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  leadTimeDays?: number;
  minimumOrderAmount?: number;
  preferred?: boolean;
  paymentTerms?: string;
  notes?: string;
}

export const CATEGORY_OPTIONS: { value: IngredientCategory; label: string }[] = [
  { value: 'RawMaterial', label: 'Raw Material' },
  { value: 'Prepared', label: 'Prepared' },
  { value: 'FinishedProduct', label: 'Finished Product' },
  { value: 'Consumable', label: 'Consumable' },
  { value: 'Packaging', label: 'Packaging' },
];

export const UNIT_OPTIONS: { value: IngredientUnit; label: string }[] = [
  { value: 'Kg', label: 'Kilogram (Kg)' },
  { value: 'G', label: 'Gram (G)' },
  { value: 'L', label: 'Liter (L)' },
  { value: 'Ml', label: 'Milliliter (Ml)' },
  { value: 'Units', label: 'Units' },
  { value: 'Pieces', label: 'Pieces' },
  { value: 'Boxes', label: 'Boxes' },
  { value: 'Cases', label: 'Cases' },
  { value: 'Bags', label: 'Bags' },
];

export const MOVEMENT_TYPE_OPTIONS: { value: StockMovementType; label: string }[] = [
  { value: 'Purchase', label: 'Purchase' },
  { value: 'Consumption', label: 'Consumption' },
  { value: 'Adjustment', label: 'Adjustment' },
  { value: 'Waste', label: 'Waste' },
  { value: 'Return', label: 'Return' },
  { value: 'Transfer', label: 'Transfer' },
];

export const PO_STATUS_OPTIONS: { value: PurchaseOrderStatus; label: string; color: string }[] = [
  { value: 'Draft', label: 'Draft', color: 'secondary' },
  { value: 'Submitted', label: 'Submitted', color: 'info' },
  { value: 'Approved', label: 'Approved', color: 'warning' },
  { value: 'Received', label: 'Received', color: 'success' },
  { value: 'Cancelled', label: 'Cancelled', color: 'danger' },
];

export function getStatusColor(status: string): 'secondary' | 'info' | 'warning' | 'success' | 'danger' {
  const option = PO_STATUS_OPTIONS.find((o) => o.value === status);
  return (option?.color as 'secondary' | 'info' | 'warning' | 'success' | 'danger') ?? 'secondary';
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatUnit(value: number, unit: string): string {
  return `${value} ${unit}`;
}
