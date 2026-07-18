export interface OrderItemConfig {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  modifiers: string[];
  notes: string | null;
  stationId: string | null;
}

export class OrderItem {
  private constructor(public readonly value: OrderItemConfig) {}

  static create(config: OrderItemConfig): OrderItem {
    if (!config.id.trim()) throw new Error("Item ID cannot be empty");
    if (config.quantity < 1) throw new Error("Quantity must be at least 1");
    if (config.unitPrice < 0) throw new Error("Unit price cannot be negative");
    return new OrderItem({ ...config });
  }

  static reconstitute(config: OrderItemConfig): OrderItem {
    return new OrderItem(config);
  }

  get id(): string { return this.value.id; }
  get orderId(): string { return this.value.orderId; }
  get menuItemId(): string { return this.value.menuItemId; }
  get menuItemName(): string { return this.value.menuItemName; }
  get quantity(): number { return this.value.quantity; }
  get unitPrice(): number { return this.value.unitPrice; }
  get modifiers(): readonly string[] { return this.value.modifiers; }
  get notes(): string | null { return this.value.notes; }
  get stationId(): string | null { return this.value.stationId; }

  get lineTotal(): number {
    return this.value.quantity * this.value.unitPrice;
  }

  equals(other: OrderItem): boolean {
    return this.value.id === other.value.id;
  }

  withQuantity(quantity: number): OrderItem {
    if (quantity < 1) throw new Error("Quantity must be at least 1");
    return OrderItem.reconstitute({ ...this.value, quantity });
  }

  withNotes(notes: string | null): OrderItem {
    return OrderItem.reconstitute({ ...this.value, notes });
  }

  withStationId(stationId: string | null): OrderItem {
    return OrderItem.reconstitute({ ...this.value, stationId });
  }
}
