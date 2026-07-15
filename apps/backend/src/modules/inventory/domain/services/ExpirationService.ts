import type { StockItem } from "../models/StockItem.js";

export interface ExpirationAlert {
  stockItemId: string;
  ingredientId: string;
  batchCode: string | null;
  quantity: number;
  expiresAt: Date;
  daysUntilExpiry: number;
  alertLevel: "critical" | "warning" | "info";
}

export class ExpirationService {
  private readonly criticalDays: number;
  private readonly warningDays: number;

  constructor(criticalDays = 1, warningDays = 7) {
    this.criticalDays = criticalDays;
    this.warningDays = warningDays;
  }

  checkExpiration(items: StockItem[]): ExpirationAlert[] {
    const alerts: ExpirationAlert[] = [];

    for (const item of items) {
      if (!item.expiresAt) continue;
      const daysUntilExpiry = item.daysUntilExpiry();
      if (daysUntilExpiry === null) continue;

      if (daysUntilExpiry <= this.criticalDays) {
        alerts.push(this.createAlert(item, daysUntilExpiry, "critical"));
      } else if (daysUntilExpiry <= this.warningDays) {
        alerts.push(this.createAlert(item, daysUntilExpiry, "warning"));
      }
    }

    return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  getExpiredItems(items: StockItem[]): StockItem[] {
    return items.filter((item) => item.isExpired());
  }

  getExpiringSoon(items: StockItem[], withinDays: number): StockItem[] {
    return items.filter((item) => {
      if (!item.expiresAt) return false;
      const days = item.daysUntilExpiry();
      return days !== null && days >= 0 && days <= withinDays;
    });
  }

  suggestUsageOrder(items: StockItem[]): StockItem[] {
    return [...items]
      .filter((item) => !item.isExpired())
      .sort((a, b) => {
        if (!a.expiresAt && !b.expiresAt) return 0;
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return a.expiresAt.getTime() - b.expiresAt.getTime();
      });
  }

  private createAlert(item: StockItem, daysUntilExpiry: number, alertLevel: "critical" | "warning" | "info"): ExpirationAlert {
    return {
      stockItemId: item.id,
      ingredientId: item.ingredientId,
      batchCode: item.batchCode ?? null,
      quantity: item.quantity,
      expiresAt: item.expiresAt!,
      daysUntilExpiry,
      alertLevel,
    };
  }
}
