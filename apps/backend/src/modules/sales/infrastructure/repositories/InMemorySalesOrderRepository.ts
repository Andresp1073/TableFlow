import type { SalesOrderRepository } from "../../domain/repositories/SalesOrderRepository.js";
import type { SalesOrder } from "../../domain/models/SalesOrder.js";
import type { OrderStatus } from "../../domain/models/OrderStatus.js";
import type { OrderSource } from "../../domain/models/SalesOrder.js";

export class InMemorySalesOrderRepository implements SalesOrderRepository {
  private readonly orders: Map<string, SalesOrder> = new Map();

  async findById(id: string): Promise<SalesOrder | null> {
    return this.orders.get(id) ?? null;
  }

  async findByRestaurant(restaurantId: string): Promise<SalesOrder[]> {
    return Array.from(this.orders.values()).filter((o) => o.restaurantId === restaurantId);
  }

  async findByTable(restaurantId: string, tableId: string): Promise<SalesOrder[]> {
    return Array.from(this.orders.values()).filter(
      (o) => o.restaurantId === restaurantId && o.tableId === tableId,
    );
  }

  async findByStatus(restaurantId: string, status: OrderStatus): Promise<SalesOrder[]> {
    return Array.from(this.orders.values()).filter(
      (o) => o.restaurantId === restaurantId && o.status === status,
    );
  }

  async findBySource(restaurantId: string, source: OrderSource): Promise<SalesOrder[]> {
    return Array.from(this.orders.values()).filter(
      (o) => o.restaurantId === restaurantId && o.source === source,
    );
  }

  async findActiveByRestaurant(restaurantId: string): Promise<SalesOrder[]> {
    return Array.from(this.orders.values()).filter(
      (o) =>
        o.restaurantId === restaurantId
        && o.status !== ("completed" as OrderStatus)
        && o.status !== ("cancelled" as OrderStatus),
    );
  }

  async findByCustomer(customerId: string): Promise<SalesOrder[]> {
    return Array.from(this.orders.values()).filter((o) => o.customerId === customerId);
  }

  async save(order: SalesOrder): Promise<void> {
    this.orders.set(order.id, order);
  }

  async delete(id: string): Promise<void> {
    this.orders.delete(id);
  }
}
