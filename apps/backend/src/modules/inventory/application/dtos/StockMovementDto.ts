import type { StockMovementType } from "../../domain/models/StockMovement.js";
import type { IngredientUnit } from "../../domain/models/Ingredient.js";

export interface AddStockDto {
  ingredientId: string;
  quantity: number;
  unit: IngredientUnit;
  costAtReceipt: number;
  batchCode?: string;
  location?: string;
  expiresAt?: Date;
  performedBy: string;
}

export interface ConsumeStockDto {
  ingredientId: string;
  quantity: number;
  unit: IngredientUnit;
  performedBy: string;
  reason?: string;
}

export interface AdjustStockDto {
  stockItemId: string;
  newQuantity: number;
  performedBy: string;
  reason: string;
}

export interface StockMovementResponseDto {
  id: string;
  type: StockMovementType;
  ingredientId: string;
  quantity: number;
  unit: string;
  totalCost: number;
  createdAt: Date;
}
