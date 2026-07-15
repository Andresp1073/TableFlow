export interface InventoryPolicyConfig {
  id: string;
  restaurantId: string;
  ingredientId: string;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  preferredSupplierId?: string;
  isActive: boolean;
}

export class InventoryPolicy {
  private constructor(public readonly value: InventoryPolicyConfig) {}

  static create(config: InventoryPolicyConfig): InventoryPolicy {
    if (config.minimumStock < 0) throw new Error("Minimum stock cannot be negative");
    if (config.maximumStock <= config.minimumStock) throw new Error("Maximum must exceed minimum");
    if (config.reorderPoint < config.minimumStock) throw new Error("Reorder point must be >= minimum");
    if (config.reorderQuantity < 1) throw new Error("Reorder quantity must be at least 1");
    return new InventoryPolicy({ ...config });
  }

  static reconstitute(config: InventoryPolicyConfig): InventoryPolicy {
    return new InventoryPolicy(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get ingredientId(): string { return this.value.ingredientId; }
  get minimumStock(): number { return this.value.minimumStock; }
  get maximumStock(): number { return this.value.maximumStock; }
  get reorderPoint(): number { return this.value.reorderPoint; }
  get reorderQuantity(): number { return this.value.reorderQuantity; }
  get preferredSupplierId(): string | undefined { return this.value.preferredSupplierId; }
  get isActive(): boolean { return this.value.isActive; }

  equals(other: InventoryPolicy): boolean { return this.value.id === other.value.id; }

  needsReorder(currentStock: number): boolean {
    return currentStock <= this.value.reorderPoint;
  }

  isOverstocked(currentStock: number): boolean {
    return currentStock > this.value.maximumStock;
  }

  isBelowMinimum(currentStock: number): boolean {
    return currentStock < this.value.minimumStock;
  }

  getRecommendedOrderQuantity(currentStock: number): number {
    if (currentStock >= this.value.reorderPoint) return 0;
    return Math.min(this.value.reorderQuantity, this.value.maximumStock - currentStock);
  }

  enable(): InventoryPolicy { return InventoryPolicy.reconstitute({ ...this.value, isActive: true }); }
  disable(): InventoryPolicy { return InventoryPolicy.reconstitute({ ...this.value, isActive: false }); }
}
