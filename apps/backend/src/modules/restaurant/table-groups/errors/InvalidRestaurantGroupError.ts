import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidRestaurantGroupError extends BusinessError {
  constructor(tableId: string, tableRestaurantId: string, expectedRestaurantId: string) {
    super(
      `Table "${tableId}" belongs to restaurant "${tableRestaurantId}", but the group expects restaurant "${expectedRestaurantId}"`,
      "table_group.invalid_restaurant",
    );
    this.name = "InvalidRestaurantGroupError";
    Object.setPrototypeOf(this, InvalidRestaurantGroupError.prototype);
  }
}
