import type { PurchaseOrderRepository } from "../../domain/repositories/PurchaseOrderRepository.js";
import type { StockItemRepository } from "../../domain/repositories/StockItemRepository.js";
import { PurchaseOrder } from "../../domain/models/PurchaseOrder.js";
import type { PurchaseOrderLineItem } from "../../domain/models/PurchaseOrder.js";
import { StockItem } from "../../domain/models/StockItem.js";
import { StockMovement, StockMovementType } from "../../domain/models/StockMovement.js";
import type { IngredientUnit } from "../../domain/models/Ingredient.js";

export class PurchasingService {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly stockItemRepository: StockItemRepository,
  ) {}

  async createPurchaseOrder(config: {
    id: string;
    restaurantId: string;
    supplierId: string;
    supplierName: string;
    items: Array<{
      ingredientId: string;
      ingredientName: string;
      quantity: number;
      unit: IngredientUnit;
      unitCost: number;
    }>;
    notes: string;
    createdBy: string;
    expectedDeliveryAt?: Date;
  }): Promise<PurchaseOrder> {
    const lineItems: PurchaseOrderLineItem[] = config.items.map((item) => ({
      ...item,
      totalCost: item.quantity * item.unitCost,
      receivedQuantity: 0,
    }));

    const order = PurchaseOrder.create({
      id: config.id,
      restaurantId: config.restaurantId,
      supplierId: config.supplierId,
      supplierName: config.supplierName,
      items: lineItems,
      notes: config.notes,
      createdBy: config.createdBy,
      expectedDeliveryAt: config.expectedDeliveryAt ?? null,
    });

    await this.purchaseOrderRepository.save(order);
    return order;
  }

  async submitOrder(orderId: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(orderId);
    if (!order) throw new Error(`Purchase order not found: ${orderId}`);
    const submitted = order.submit();
    await this.purchaseOrderRepository.save(submitted);
    return submitted;
  }

  async approveOrder(orderId: string, approvedBy: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(orderId);
    if (!order) throw new Error(`Purchase order not found: ${orderId}`);
    const approved = order.approve(approvedBy);
    await this.purchaseOrderRepository.save(approved);
    return approved;
  }

  async receiveOrder(
    orderId: string,
    receivedItems: Array<{ ingredientId: string; receivedQuantity: number }>,
  ): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(orderId);
    if (!order) throw new Error(`Purchase order not found: ${orderId}`);

    const received = order.receive(receivedItems);
    await this.purchaseOrderRepository.save(received);

    for (const receivedItem of receivedItems) {
      const lineItem = order.items.find((i) => i.ingredientId === receivedItem.ingredientId);
      if (!lineItem || receivedItem.receivedQuantity <= 0) continue;

      const stockItem = StockItem.create({
        id: crypto.randomUUID(),
        restaurantId: order.restaurantId,
        ingredientId: receivedItem.ingredientId,
        quantity: receivedItem.receivedQuantity,
        unit: lineItem.unit,
        batchCode: undefined,
        receivedAt: new Date(),
        expiresAt: null,
        costAtReceipt: lineItem.unitCost,
        isActive: true,
      });

      await this.stockItemRepository.save(stockItem);
    }

    return received;
  }

  async cancelOrder(orderId: string, reason?: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(orderId);
    if (!order) throw new Error(`Purchase order not found: ${orderId}`);
    const cancelled = order.cancel(reason);
    await this.purchaseOrderRepository.save(cancelled);
    return cancelled;
  }

  async getPendingOrders(restaurantId: string): Promise<PurchaseOrder[]> {
    const orders = await this.purchaseOrderRepository.findByRestaurant(restaurantId);
    return orders.filter((o) =>
      o.status === "draft" || o.status === "submitted" || o.status === "approved",
    );
  }

  async checkOverdueDeliveries(): Promise<PurchaseOrder[]> {
    const pending = await this.purchaseOrderRepository.findPendingDelivery();
    const now = new Date();
    return pending.filter((o) => o.expectedDeliveryAt && o.expectedDeliveryAt < now);
  }
}
