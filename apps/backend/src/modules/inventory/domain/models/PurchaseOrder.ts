import type { IngredientUnit } from "./Ingredient.js";

export enum PurchaseOrderStatus {
  Draft = "draft",
  Submitted = "submitted",
  Approved = "approved",
  Received = "received",
  Cancelled = "cancelled",
}

export const PURCHASE_ORDER_TRANSITIONS: Record<PurchaseOrderStatus, readonly PurchaseOrderStatus[]> = {
  [PurchaseOrderStatus.Draft]: [PurchaseOrderStatus.Submitted, PurchaseOrderStatus.Cancelled],
  [PurchaseOrderStatus.Submitted]: [PurchaseOrderStatus.Approved, PurchaseOrderStatus.Cancelled],
  [PurchaseOrderStatus.Approved]: [PurchaseOrderStatus.Received, PurchaseOrderStatus.Cancelled],
  [PurchaseOrderStatus.Received]: [],
  [PurchaseOrderStatus.Cancelled]: [],
};

export interface PurchaseOrderLineItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: IngredientUnit;
  unitCost: number;
  totalCost: number;
  receivedQuantity: number;
}

export interface PurchaseOrderConfig {
  id: string;
  restaurantId: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderLineItem[];
  totalAmount: number;
  notes: string;
  orderedAt: Date | null;
  expectedDeliveryAt: Date | null;
  receivedAt: Date | null;
  createdBy: string;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PurchaseOrder {
  private constructor(public readonly value: PurchaseOrderConfig) {}

  static create(config: Omit<PurchaseOrderConfig, "status" | "createdAt" | "updatedAt" | "orderedAt" | "receivedAt" | "approvedBy">): PurchaseOrder {
    const now = new Date();
    const totalAmount = config.items.reduce((sum, i) => sum + i.totalCost, 0);
    return new PurchaseOrder({
      ...config,
      status: PurchaseOrderStatus.Draft,
      totalAmount,
      orderedAt: null,
      receivedAt: null,
      approvedBy: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(config: PurchaseOrderConfig): PurchaseOrder {
    return new PurchaseOrder(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get supplierId(): string { return this.value.supplierId; }
  get supplierName(): string { return this.value.supplierName; }
  get status(): PurchaseOrderStatus { return this.value.status; }
  get items(): readonly PurchaseOrderLineItem[] { return this.value.items; }
  get totalAmount(): number { return this.value.totalAmount; }
  get notes(): string { return this.value.notes; }
  get orderedAt(): Date | null { return this.value.orderedAt; }
  get expectedDeliveryAt(): Date | null { return this.value.expectedDeliveryAt; }
  get receivedAt(): Date | null { return this.value.receivedAt; }
  get createdBy(): string { return this.value.createdBy; }
  get approvedBy(): string | null { return this.value.approvedBy; }
  get createdAt(): Date { return this.value.createdAt; }
  get updatedAt(): Date { return this.value.updatedAt; }

  equals(other: PurchaseOrder): boolean { return this.value.id === other.value.id; }

  canTransitionTo(target: PurchaseOrderStatus): boolean {
    return PURCHASE_ORDER_TRANSITIONS[this.value.status].includes(target);
  }

  submit(): PurchaseOrder {
    return this.transitionTo(PurchaseOrderStatus.Submitted, { orderedAt: new Date() });
  }

  approve(approvedBy: string): PurchaseOrder {
    return this.transitionTo(PurchaseOrderStatus.Approved, { approvedBy });
  }

  receive(receivedItems: Array<{ ingredientId: string; receivedQuantity: number }>): PurchaseOrder {
    if (!this.canTransitionTo(PurchaseOrderStatus.Received)) {
      throw new Error(`Cannot receive order in status: ${this.value.status}`);
    }

    const updatedItems = this.value.items.map((item) => {
      const received = receivedItems.find((r) => r.ingredientId === item.ingredientId);
      return {
        ...item,
        receivedQuantity: received ? received.receivedQuantity : item.receivedQuantity,
      };
    });

    return PurchaseOrder.reconstitute({
      ...this.value,
      status: PurchaseOrderStatus.Received,
      items: updatedItems,
      receivedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  cancel(reason?: string): PurchaseOrder {
    return this.transitionTo(PurchaseOrderStatus.Cancelled, {
      notes: reason ? `${this.value.notes}\nCancellation: ${reason}` : this.value.notes,
    });
  }

  private transitionTo(target: PurchaseOrderStatus, updates?: Partial<PurchaseOrderConfig>): PurchaseOrder {
    if (!this.canTransitionTo(target)) {
      throw new Error(`Cannot transition from ${this.value.status} to ${target}`);
    }
    return PurchaseOrder.reconstitute({
      ...this.value,
      ...updates,
      status: target,
      updatedAt: new Date(),
    });
  }

  getReceivedItemsCount(): number {
    return this.value.items.filter((i) => i.receivedQuantity > 0).length;
  }

  isFullyReceived(): boolean {
    return this.value.items.every((i) => i.receivedQuantity >= i.quantity);
  }

  getOutstandingItems(): PurchaseOrderLineItem[] {
    return this.value.items.filter((i) => i.receivedQuantity < i.quantity);
  }
}
