import type { IngredientUnit } from "./Ingredient.js";

export enum StockMovementType {
  Purchase = "purchase",
  Consumption = "consumption",
  Adjustment = "adjustment",
  Waste = "waste",
  Return = "return",
  Transfer = "transfer",
}

export interface StockMovementConfig {
  id: string;
  restaurantId: string;
  ingredientId: string;
  stockItemId: string;
  type: StockMovementType;
  quantity: number;
  unit: IngredientUnit;
  unitCost: number;
  totalCost: number;
  referenceId?: string;
  reason?: string;
  performedBy: string;
  createdAt: Date;
}

export class StockMovement {
  private constructor(public readonly value: StockMovementConfig) {}

  static create(config: Omit<StockMovementConfig, "createdAt" | "totalCost">): StockMovement {
    const totalCost = config.quantity * config.unitCost;
    return new StockMovement({
      ...config,
      totalCost,
      createdAt: new Date(),
    });
  }

  static reconstitute(config: StockMovementConfig): StockMovement {
    return new StockMovement(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get ingredientId(): string { return this.value.ingredientId; }
  get stockItemId(): string { return this.value.stockItemId; }
  get type(): StockMovementType { return this.value.type; }
  get quantity(): number { return this.value.quantity; }
  get unit(): IngredientUnit { return this.value.unit; }
  get unitCost(): number { return this.value.unitCost; }
  get totalCost(): number { return this.value.totalCost; }
  get referenceId(): string | undefined { return this.value.referenceId; }
  get reason(): string | undefined { return this.value.reason; }
  get performedBy(): string { return this.value.performedBy; }
  get createdAt(): Date { return this.value.createdAt; }

  equals(other: StockMovement): boolean { return this.value.id === other.value.id; }

  isIncrease(): boolean {
    return this.value.type === StockMovementType.Purchase
      || this.value.type === StockMovementType.Return
      || this.value.type === StockMovementType.Adjustment && this.value.quantity > 0;
  }

  isDecrease(): boolean {
    return this.value.type === StockMovementType.Consumption
      || this.value.type === StockMovementType.Waste
      || this.value.type === StockMovementType.Adjustment && this.value.quantity < 0
      || this.value.type === StockMovementType.Transfer;
  }
}
