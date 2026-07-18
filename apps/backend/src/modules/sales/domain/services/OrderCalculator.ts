import type { SalesOrder } from "../models/SalesOrder.js";

export interface OrderSummary {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  itemCount: number;
}

export class OrderCalculator {
  calculateSummary(order: SalesOrder): OrderSummary {
    return {
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      total: order.total,
      itemCount: order.items.length,
    };
  }

  calculateTax(subtotal: number, taxRate: number): number {
    return Math.round(subtotal * taxRate * 100) / 100;
  }

  applyDiscount(
    subtotal: number,
    discountPercent: number,
    maxDiscount?: number,
  ): number {
    const discount = subtotal * (discountPercent / 100);
    if (maxDiscount !== undefined) {
      return Math.min(discount, maxDiscount);
    }
    return discount;
  }

  splitTotal(total: number, parts: number): number[] {
    if (parts < 1) throw new Error("Parts must be at least 1");
    const each = Math.floor((total * 100) / parts) / 100;
    const remainder = Math.round((total - each * parts) * 100) / 100;
    const amounts = Array(parts).fill(each);
    amounts[amounts.length - 1] = Math.round((each + remainder) * 100) / 100;
    return amounts;
  }
}
