import type { StockItemRepository } from "../../domain/repositories/StockItemRepository.js";
import type { IngredientRepository } from "../../domain/repositories/IngredientRepository.js";
import type { PurchaseOrderRepository } from "../../domain/repositories/PurchaseOrderRepository.js";
import type { StockItem } from "../../domain/models/StockItem.js";
import type { Ingredient } from "../../domain/models/Ingredient.js";
import type { IngredientCategory } from "../../domain/models/Ingredient.js";
import type { PurchaseOrder } from "../../domain/models/PurchaseOrder.js";
import type { PurchaseOrderStatus } from "../../domain/models/PurchaseOrder.js";

export class InMemoryStockItemRepository implements StockItemRepository {
  private readonly items: Map<string, StockItem> = new Map();

  async findById(id: string): Promise<StockItem | null> {
    return this.items.get(id) ?? null;
  }
  async findByIngredient(ingredientId: string): Promise<StockItem[]> {
    return Array.from(this.items.values()).filter((i) => i.ingredientId === ingredientId && i.isActive);
  }
  async findByRestaurant(restaurantId: string): Promise<StockItem[]> {
    return Array.from(this.items.values()).filter((i) => i.restaurantId === restaurantId && i.isActive);
  }
  async findExpired(): Promise<StockItem[]> {
    return Array.from(this.items.values()).filter((i) => i.isExpired());
  }
  async findLowStock(threshold: number): Promise<StockItem[]> {
    return Array.from(this.items.values()).filter((i) => i.isLowStock(threshold));
  }
  async save(item: StockItem): Promise<void> { this.items.set(item.id, item); }
  async delete(id: string): Promise<void> { this.items.delete(id); }
}

export class InMemoryIngredientRepository implements IngredientRepository {
  private readonly ingredients: Map<string, Ingredient> = new Map();

  async findById(id: string): Promise<Ingredient | null> {
    return this.ingredients.get(id) ?? null;
  }
  async findByRestaurant(restaurantId: string): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values()).filter((i) => i.restaurantId === restaurantId);
  }
  async findByCategory(category: IngredientCategory): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values()).filter((i) => i.category === category);
  }
  async findActive(restaurantId: string): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values()).filter((i) => i.restaurantId === restaurantId && i.isActive);
  }
  async save(ingredient: Ingredient): Promise<void> { this.ingredients.set(ingredient.id, ingredient); }
  async delete(id: string): Promise<void> { this.ingredients.delete(id); }
}

export class InMemoryPurchaseOrderRepository implements PurchaseOrderRepository {
  private readonly orders: Map<string, PurchaseOrder> = new Map();

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.orders.get(id) ?? null;
  }
  async findByRestaurant(restaurantId: string): Promise<PurchaseOrder[]> {
    return Array.from(this.orders.values()).filter((o) => o.restaurantId === restaurantId);
  }
  async findBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    return Array.from(this.orders.values()).filter((o) => o.supplierId === supplierId);
  }
  async findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    return Array.from(this.orders.values()).filter((o) => o.status === status);
  }
  async findPendingDelivery(): Promise<PurchaseOrder[]> {
    return Array.from(this.orders.values()).filter((o) =>
      o.status === "approved" || o.status === "submitted",
    );
  }
  async save(order: PurchaseOrder): Promise<void> { this.orders.set(order.id, order); }
  async delete(id: string): Promise<void> { this.orders.delete(id); }
}
