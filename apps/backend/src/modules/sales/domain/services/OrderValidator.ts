import type { SalesOrder } from "../models/SalesOrder.js";
import { OrderStatus } from "../models/OrderStatus.js";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class OrderValidator {
  validateForSubmission(order: SalesOrder): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (order.items.length === 0) {
      errors.push("Order must have at least one item");
    }
    if (order.total <= 0) {
      errors.push("Order total must be greater than zero");
    }
    if (order.status !== OrderStatus.Draft) {
      errors.push(`Cannot submit order in status: ${order.status}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateForPayment(order: SalesOrder): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (order.items.length === 0) {
      errors.push("Cannot process payment for order with no items");
    }
    if (order.total <= 0) {
      errors.push("Order total must be greater than zero");
    }
    if (order.paymentStatus === "paid") {
      warnings.push("Order has already been paid");
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  validateItemQuantity(quantity: number): ValidationResult {
    const errors: string[] = [];
    if (quantity < 1) errors.push("Quantity must be at least 1");
    if (quantity > 100) errors.push("Quantity cannot exceed 100");
    return { isValid: errors.length === 0, errors, warnings: [] };
  }
}
