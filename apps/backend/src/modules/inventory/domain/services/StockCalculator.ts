import type { StockItem } from "../models/StockItem.js";
import type { StockMovement } from "../models/StockMovement.js";
import { StockMovementType } from "../models/StockMovement.js";

export interface StockSummary {
  ingredientId: string;
  totalQuantity: number;
  totalValue: number;
  averageCost: number;
  itemCount: number;
  isLowStock: boolean;
  isExpired: boolean;
}

export class StockCalculator {
  calculateTotalStock(items: StockItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  calculateTotalValue(items: StockItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity * item.costAtReceipt, 0);
  }

  calculateAverageCost(items: StockItem[]): number {
    const totalQty = this.calculateTotalStock(items);
    if (totalQty === 0) return 0;
    return this.calculateTotalValue(items) / totalQty;
  }

  summarizeStock(items: StockItem[]): StockSummary[] {
    const grouped = new Map<string, StockItem[]>();
    for (const item of items) {
      const existing = grouped.get(item.ingredientId) ?? [];
      existing.push(item);
      grouped.set(item.ingredientId, existing);
    }

    const summaries: StockSummary[] = [];
    for (const [ingredientId, ingredientItems] of grouped) {
      summaries.push({
        ingredientId,
        totalQuantity: this.calculateTotalStock(ingredientItems),
        totalValue: this.calculateTotalValue(ingredientItems),
        averageCost: this.calculateAverageCost(ingredientItems),
        itemCount: ingredientItems.length,
        isLowStock: ingredientItems.some((i) => i.isLowStock(0)),
        isExpired: ingredientItems.some((i) => i.isExpired()),
      });
    }

    return summaries;
  }

  calculateMovementTotal(ingredientId: string, movements: StockMovement[], type: StockMovementType): number {
    return movements
      .filter((m) => m.ingredientId === ingredientId && m.type === type)
      .reduce((sum, m) => sum + m.quantity, 0);
  }

  calculateConsumptionRate(
    movements: StockMovement[],
    days: number,
  ): Map<string, number> {
    const since = new Date(Date.now() - days * 86400000);
    const consumption = new Map<string, number>();

    for (const m of movements) {
      if (m.type !== StockMovementType.Consumption) continue;
      if (m.createdAt < since) continue;
      const current = consumption.get(m.ingredientId) ?? 0;
      consumption.set(m.ingredientId, current + m.quantity);
    }

    return consumption;
  }
}
