import { describe, it, expect } from "vitest";
import { ExpirationService } from "../domain/services/ExpirationService.js";
import { StockItem } from "../domain/models/StockItem.js";
import { IngredientUnit } from "../domain/models/Ingredient.js";

function createItem(id: string, daysUntilExpiry: number | null): StockItem {
  return StockItem.reconstitute({
    id, restaurantId: "r-1", ingredientId: "beef-1",
    quantity: 10, unit: IngredientUnit.Kg,
    receivedAt: new Date(),
    expiresAt: daysUntilExpiry !== null ? new Date(Date.now() + daysUntilExpiry * 86400000) : null,
    costAtReceipt: 5, isActive: true,
    batchCode: `batch-${id}`,
  });
}

describe("ExpirationService", () => {
  const service = new ExpirationService(1, 7);

  it("returns critical alerts for items expiring within 1 day", () => {
    const items = [createItem("s1", 0)];
    const alerts = service.checkExpiration(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertLevel).toBe("critical");
  });

  it("returns warning alerts for items expiring within 7 days", () => {
    const items = [createItem("s1", 5)];
    const alerts = service.checkExpiration(items);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertLevel).toBe("warning");
  });

  it("ignores items with no expiry", () => {
    const items = [createItem("s1", null)];
    const alerts = service.checkExpiration(items);
    expect(alerts).toHaveLength(0);
  });

  it("finds expired items", () => {
    const items = [
      createItem("s1", -1),
      createItem("s2", 10),
    ];
    const expired = service.getExpiredItems(items);
    expect(expired).toHaveLength(1);
    expect(expired[0].id).toBe("s1");
  });

  it("finds items expiring within a window", () => {
    const items = [
      createItem("s1", 3),
      createItem("s2", 14),
    ];
    const expiring = service.getExpiringSoon(items, 7);
    expect(expiring).toHaveLength(1);
  });

  it("suggests FIFO-by-expiry usage order", () => {
    const items = [
      createItem("old", 10),
      createItem("newer", 20),
      createItem("expiring", 2),
    ];
    const sorted = service.suggestUsageOrder(items);
    expect(sorted[0].id).toBe("expiring");
    expect(sorted[1].id).toBe("old");
    expect(sorted[2].id).toBe("newer");
  });
});
