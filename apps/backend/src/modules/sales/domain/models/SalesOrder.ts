import { OrderStatus, ORDER_STATUS_TRANSITIONS } from "./OrderStatus.js";
import type { OrderItem } from "./OrderItem.js";
import type { KitchenPriority } from "../../../../modules/kitchen/domain/models/KitchenPriority.js";

export type OrderSource = "pos" | "online" | "walk_in" | "phone" | "tablet";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "partially_refunded";

export interface SalesOrderConfig {
  id: string;
  restaurantId: string;
  tableId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerCount: number | null;
  status: OrderStatus;
  source: OrderSource;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentTransactionId: string | null;
  posReference: string | null;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

export class SalesOrder {
  private constructor(public readonly value: SalesOrderConfig) {}

  static create(config: Omit<SalesOrderConfig, "status" | "subtotal" | "taxAmount" | "discountAmount" | "total" | "paymentStatus" | "paymentTransactionId" | "createdAt" | "updatedAt" | "submittedAt" | "completedAt" | "cancelledAt" | "cancellationReason" | "notes">): SalesOrder {
    const now = new Date();
    return new SalesOrder({
      ...config,
      status: OrderStatus.Draft,
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      total: 0,
      paymentStatus: "unpaid",
      paymentTransactionId: null,
      notes: [],
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancellationReason: null,
    });
  }

  static reconstitute(config: SalesOrderConfig): SalesOrder {
    return new SalesOrder(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get tableId(): string | null { return this.value.tableId; }
  get customerId(): string | null { return this.value.customerId; }
  get customerName(): string | null { return this.value.customerName; }
  get customerCount(): number | null { return this.value.customerCount; }
  get status(): OrderStatus { return this.value.status; }
  get source(): OrderSource { return this.value.source; }
  get items(): readonly OrderItem[] { return this.value.items; }
  get subtotal(): number { return this.value.subtotal; }
  get taxAmount(): number { return this.value.taxAmount; }
  get discountAmount(): number { return this.value.discountAmount; }
  get total(): number { return this.value.total; }
  get paymentStatus(): PaymentStatus { return this.value.paymentStatus; }
  get paymentTransactionId(): string | null { return this.value.paymentTransactionId; }
  get posReference(): string | null { return this.value.posReference; }
  get notes(): readonly string[] { return this.value.notes; }
  get createdAt(): Date { return this.value.createdAt; }
  get updatedAt(): Date { return this.value.updatedAt; }
  get submittedAt(): Date | null { return this.value.submittedAt; }
  get completedAt(): Date | null { return this.value.completedAt; }
  get cancelledAt(): Date | null { return this.value.cancelledAt; }
  get cancellationReason(): string | null { return this.value.cancellationReason; }

  canTransitionTo(target: OrderStatus): boolean {
    const allowed = ORDER_STATUS_TRANSITIONS[this.value.status];
    return allowed.includes(target);
  }

  transitionTo(target: OrderStatus, reason?: string): SalesOrder {
    if (!this.canTransitionTo(target)) {
      throw new Error(`Cannot transition from ${this.value.status} to ${target}`);
    }
    const now = new Date();
    const updates: Partial<SalesOrderConfig> = { status: target, updatedAt: now };
    if (target === OrderStatus.Submitted) updates.submittedAt = now;
    if (target === OrderStatus.Completed) updates.completedAt = now;
    if (target === OrderStatus.Cancelled) {
      updates.cancelledAt = now;
      updates.cancellationReason = reason ?? null;
    }
    return SalesOrder.reconstitute({ ...this.value, ...updates });
  }

  recalculate(): SalesOrder {
    const subtotal = this.value.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + taxAmount - this.value.discountAmount;
    return SalesOrder.reconstitute({
      ...this.value,
      subtotal,
      taxAmount,
      total: Math.max(0, total),
      updatedAt: new Date(),
    });
  }

  addItem(item: OrderItem): SalesOrder {
    if (this.value.status !== OrderStatus.Draft) {
      throw new Error("Can only add items to draft orders");
    }
    const updated = SalesOrder.reconstitute({
      ...this.value,
      items: [...this.value.items, item],
    });
    return updated.recalculate();
  }

  updateItem(itemId: string, updater: (item: OrderItem) => OrderItem): SalesOrder {
    if (this.value.status !== OrderStatus.Draft) {
      throw new Error("Can only update items in draft orders");
    }
    const updated = SalesOrder.reconstitute({
      ...this.value,
      items: this.value.items.map((item) =>
        item.id === itemId ? updater(item) : item,
      ),
    });
    return updated.recalculate();
  }

  removeItem(itemId: string): SalesOrder {
    if (this.value.status !== OrderStatus.Draft) {
      throw new Error("Can only remove items from draft orders");
    }
    const updated = SalesOrder.reconstitute({
      ...this.value,
      items: this.value.items.filter((item) => item.id !== itemId),
    });
    return updated.recalculate();
  }

  submit(): SalesOrder {
    if (this.value.items.length === 0) {
      throw new Error("Cannot submit order with no items");
    }
    return this.transitionTo(OrderStatus.Submitted);
  }

  markInProgress(): SalesOrder {
    return this.transitionTo(OrderStatus.InProgress);
  }

  markReady(): SalesOrder {
    return this.transitionTo(OrderStatus.Ready);
  }

  complete(paymentTransactionId?: string): SalesOrder {
    let order = this.transitionTo(OrderStatus.Completed);
    if (paymentTransactionId) {
      order = SalesOrder.reconstitute({
        ...order.value,
        paymentStatus: "paid" as PaymentStatus,
        paymentTransactionId,
      });
    }
    return order;
  }

  cancel(reason: string): SalesOrder {
    return this.transitionTo(OrderStatus.Cancelled, reason);
  }

  addNote(note: string): SalesOrder {
    return SalesOrder.reconstitute({
      ...this.value,
      notes: [...this.value.notes, note],
      updatedAt: new Date(),
    });
  }

  get kitchenPriority(): KitchenPriority {
    if (this.value.status === OrderStatus.Ready) return "normal" as KitchenPriority;
    if (this.value.status === OrderStatus.InProgress) return "normal" as KitchenPriority;
    return "normal" as KitchenPriority;
  }
}
