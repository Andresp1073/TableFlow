import { describe, it, expect } from "vitest";
import { InventoryPolicy } from "../domain/models/InventoryPolicy.js";

describe("InventoryPolicy", () => {
  const policy = InventoryPolicy.create({
    id: "policy-1",
    restaurantId: "rest-1",
    ingredientId: "beef-1",
    minimumStock: 10,
    maximumStock: 100,
    reorderPoint: 25,
    reorderQuantity: 50,
    isActive: true,
  });

  it("creates with valid bounds", () => {
    expect(policy.minimumStock).toBe(10);
    expect(policy.maximumStock).toBe(100);
  });

  it("detects need for reorder", () => {
    expect(policy.needsReorder(20)).toBe(true);
    expect(policy.needsReorder(30)).toBe(false);
  });

  it("detects overstock", () => {
    expect(policy.isOverstocked(150)).toBe(true);
    expect(policy.isOverstocked(80)).toBe(false);
  });

  it("detects below minimum", () => {
    expect(policy.isBelowMinimum(5)).toBe(true);
    expect(policy.isBelowMinimum(15)).toBe(false);
  });

  it("recommends order quantity", () => {
    expect(policy.getRecommendedOrderQuantity(20)).toBe(50);
    expect(policy.getRecommendedOrderQuantity(5)).toBe(50);
    expect(policy.getRecommendedOrderQuantity(50)).toBe(0);
  });

  it("rejects invalid configuration", () => {
    expect(() => InventoryPolicy.create({
      id: "bad", restaurantId: "r-1", ingredientId: "i-1",
      minimumStock: -1, maximumStock: 10, reorderPoint: 5, reorderQuantity: 5, isActive: true,
    })).toThrow("Minimum stock cannot be negative");

    expect(() => InventoryPolicy.create({
      id: "bad2", restaurantId: "r-1", ingredientId: "i-1",
      minimumStock: 20, maximumStock: 10, reorderPoint: 25, reorderQuantity: 5, isActive: true,
    })).toThrow("Maximum must exceed minimum");
  });

  it("enables and disables", () => {
    expect(policy.disable().isActive).toBe(false);
    expect(policy.enable().isActive).toBe(true);
  });
});
