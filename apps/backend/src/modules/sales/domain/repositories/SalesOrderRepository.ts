import type { SalesOrder } from "../models/SalesOrder.js";
import type { OrderStatus } from "../models/OrderStatus.js";
import type { OrderSource } from "../models/SalesOrder.js";

export interface SalesOrderRepository {
  findById(id: string): Promise<SalesOrder | null>;
  findByRestaurant(restaurantId: string): Promise<SalesOrder[]>;
  findByTable(restaurantId: string, tableId: string): Promise<SalesOrder[]>;
  findByStatus(restaurantId: string, status: OrderStatus): Promise<SalesOrder[]>;
  findBySource(restaurantId: string, source: OrderSource): Promise<SalesOrder[]>;
  findActiveByRestaurant(restaurantId: string): Promise<SalesOrder[]>;
  findByCustomer(customerId: string): Promise<SalesOrder[]>;
  save(order: SalesOrder): Promise<void>;
  delete(id: string): Promise<void>;
}
