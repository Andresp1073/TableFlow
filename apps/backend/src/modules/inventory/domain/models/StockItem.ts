import type { IngredientUnit } from "./Ingredient.js";

export interface StockItemConfig {
  id: string;
  restaurantId: string;
  ingredientId: string;
  quantity: number;
  unit: IngredientUnit;
  location?: string;
  batchCode?: string;
  receivedAt: Date;
  expiresAt: Date | null;
  costAtReceipt: number;
  isActive: boolean;
}

export class StockItem {
  private constructor(public readonly value: StockItemConfig) {}

  static create(config: StockItemConfig): StockItem {
    if (!config.id.trim()) throw new Error("Stock item ID cannot be empty");
    if (config.quantity < 0) throw new Error("Quantity cannot be negative");
    return new StockItem({ ...config });
  }

  static reconstitute(config: StockItemConfig): StockItem {
    return new StockItem(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get ingredientId(): string { return this.value.ingredientId; }
  get quantity(): number { return this.value.quantity; }
  get unit(): IngredientUnit { return this.value.unit; }
  get location(): string | undefined { return this.value.location; }
  get batchCode(): string | undefined { return this.value.batchCode; }
  get receivedAt(): Date { return this.value.receivedAt; }
  get expiresAt(): Date | null { return this.value.expiresAt; }
  get costAtReceipt(): number { return this.value.costAtReceipt; }
  get isActive(): boolean { return this.value.isActive; }

  equals(other: StockItem): boolean { return this.value.id === other.value.id; }

  increaseStock(quantity: number): StockItem {
    if (quantity <= 0) throw new Error("Increase quantity must be positive");
    return StockItem.reconstitute({ ...this.value, quantity: this.value.quantity + quantity });
  }

  decreaseStock(quantity: number): StockItem {
    if (quantity <= 0) throw new Error("Decrease quantity must be positive");
    if (quantity > this.value.quantity) throw new Error("Insufficient stock");
    return StockItem.reconstitute({ ...this.value, quantity: this.value.quantity - quantity });
  }

  adjustStock(newQuantity: number): StockItem {
    if (newQuantity < 0) throw new Error("Adjusted quantity cannot be negative");
    return StockItem.reconstitute({ ...this.value, quantity: newQuantity });
  }

  isLowStock(threshold: number): boolean {
    return this.value.quantity <= threshold;
  }

  isExpired(): boolean {
    if (!this.value.expiresAt) return false;
    return new Date() > this.value.expiresAt;
  }

  daysUntilExpiry(): number | null {
    if (!this.value.expiresAt) return null;
    return Math.ceil((this.value.expiresAt.getTime() - Date.now()) / 86400000);
  }
}
