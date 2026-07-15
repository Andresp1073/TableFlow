import type { PurchaseOrderStatus } from "../../domain/models/PurchaseOrder.js";
import type { IngredientUnit } from "../../domain/models/Ingredient.js";

export interface CreatePurchaseOrderDto {
  supplierId: string;
  supplierName: string;
  items: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: IngredientUnit;
    unitCost: number;
  }>;
  notes?: string;
  createdBy: string;
  expectedDeliveryAt?: Date;
}

export interface PurchaseOrderResponseDto {
  id: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: Date;
  expectedDeliveryAt: Date | null;
}
