import { describe, it, expect } from "vitest";
import { PurchaseOrder, PurchaseOrderStatus } from "../domain/models/PurchaseOrder.js";
import { IngredientUnit } from "../domain/models/Ingredient.js";

function createTestOrder(overrides?: Record<string, unknown>): PurchaseOrder {
  return PurchaseOrder.create({
    id: "po-1",
    restaurantId: "rest-1",
    supplierId: "supplier-1",
    supplierName: "Test Supplier",
    items: [
      { ingredientId: "i-1", ingredientName: "Beef", quantity: 50, unit: IngredientUnit.Kg, unitCost: 8, totalCost: 400, receivedQuantity: 0 },
      { ingredientId: "i-2", ingredientName: "Buns", quantity: 100, unit: IngredientUnit.Units, unitCost: 0.5, totalCost: 50, receivedQuantity: 0 },
    ],
    notes: "Test order",
    createdBy: "user-1",
    expectedDeliveryAt: null,
    ...overrides,
  } as any);
}

describe("PurchaseOrder", () => {
  it("creates in Draft status", () => {
    const po = createTestOrder();
    expect(po.status).toBe(PurchaseOrderStatus.Draft);
    expect(po.totalAmount).toBe(450);
  });

  it("transitions through lifecycle", () => {
    const po = createTestOrder();

    const submitted = po.submit();
    expect(submitted.status).toBe(PurchaseOrderStatus.Submitted);
    expect(submitted.orderedAt).toBeInstanceOf(Date);

    const approved = submitted.approve("manager-1");
    expect(approved.status).toBe(PurchaseOrderStatus.Approved);
    expect(approved.approvedBy).toBe("manager-1");

    const received = approved.receive([
      { ingredientId: "i-1", receivedQuantity: 50 },
      { ingredientId: "i-2", receivedQuantity: 100 },
    ]);
    expect(received.status).toBe(PurchaseOrderStatus.Received);
    expect(received.receivedAt).toBeInstanceOf(Date);
    expect(received.isFullyReceived()).toBe(true);
  });

  it("cancels an order", () => {
    const po = createTestOrder();
    const cancelled = po.cancel("Supplier unavailable");
    expect(cancelled.status).toBe(PurchaseOrderStatus.Cancelled);
  });

  it("rejects invalid transitions", () => {
    const po = createTestOrder();
    const received = po.submit().approve("mgr-1").receive([
      { ingredientId: "i-1", receivedQuantity: 50 },
      { ingredientId: "i-2", receivedQuantity: 100 },
    ]);
    expect(() => received.submit()).toThrow("Cannot transition from received to submitted");
  });

  it("tracks partial receipts", () => {
    const po = createTestOrder();
    const approved = po.submit().approve("mgr-1");
    const received = approved.receive([
      { ingredientId: "i-1", receivedQuantity: 25 },
    ]);
    expect(received.isFullyReceived()).toBe(false);
    expect(received.getOutstandingItems()).toHaveLength(2);
  });

  it("calculates outstanding items", () => {
    const po = createTestOrder();
    const approved = po.submit().approve("mgr-1");
    const received = approved.receive([
      { ingredientId: "i-1", receivedQuantity: 50 },
      { ingredientId: "i-2", receivedQuantity: 50 },
    ]);
    const outstanding = received.getOutstandingItems();
    expect(outstanding).toHaveLength(1);
    expect(outstanding[0].ingredientId).toBe("i-2");
    expect(outstanding[0].receivedQuantity).toBe(50);
  });
});
