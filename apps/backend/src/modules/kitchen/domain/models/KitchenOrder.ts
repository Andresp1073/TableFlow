export enum OrderSource {
  POS = "pos",
  Online = "online",
  WalkIn = "walk_in",
  Phone = "phone",
  Tablet = "tablet",
}

export interface KitchenOrderConfig {
  id: string;
  restaurantId: string;
  tableId?: string;
  customerName?: string;
  customerCount?: number;
  source: OrderSource;
  posReference?: string;
  notes?: string;
}

export class KitchenOrder {
  private constructor(public readonly value: KitchenOrderConfig) {}

  static create(config: KitchenOrderConfig): KitchenOrder {
    if (!config.id.trim()) {
      throw new Error("Order ID cannot be empty");
    }
    if (!config.restaurantId.trim()) {
      throw new Error("Restaurant ID cannot be empty");
    }
    return new KitchenOrder({ ...config });
  }

  static reconstitute(config: KitchenOrderConfig): KitchenOrder {
    return new KitchenOrder(config);
  }

  equals(other: KitchenOrder): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get restaurantId(): string {
    return this.value.restaurantId;
  }

  get tableId(): string | undefined {
    return this.value.tableId;
  }

  get customerName(): string | undefined {
    return this.value.customerName;
  }

  get customerCount(): number | undefined {
    return this.value.customerCount;
  }

  get source(): OrderSource {
    return this.value.source;
  }

  get posReference(): string | undefined {
    return this.value.posReference;
  }

  get notes(): string | undefined {
    return this.value.notes;
  }
}
