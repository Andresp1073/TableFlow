import type { PurchaseOrder } from "../models/PurchaseOrder.js";
import type { PurchaseOrderStatus } from "../models/PurchaseOrder.js";

export interface PurchaseOrderRepository {
  findById(id: string): Promise<PurchaseOrder | null>;
  findByRestaurant(restaurantId: string): Promise<PurchaseOrder[]>;
  findBySupplier(supplierId: string): Promise<PurchaseOrder[]>;
  findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]>;
  findPendingDelivery(): Promise<PurchaseOrder[]>;
  save(order: PurchaseOrder): Promise<void>;
  delete(id: string): Promise<void>;
}
