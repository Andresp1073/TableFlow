import type { PricingRule } from "../models/PricingRule.js";

export class PricingEngine {
  findBestRule(rules: PricingRule[], occupancyRate: number, partySize: number, dayOfWeek: number, timeSlot: string): PricingRule | null {
    const applicable = rules
      .filter((r) => r.isApplicable(occupancyRate, partySize, dayOfWeek, timeSlot))
      .sort((a, b) => b.priority - a.priority);

    return applicable[0] ?? null;
  }

  calculatePrice(basePrice: number, rules: PricingRule[], occupancyRate: number, partySize: number, dayOfWeek: number, timeSlot: string): { price: number; appliedRule: PricingRule | null } {
    const rule = this.findBestRule(rules, occupancyRate, partySize, dayOfWeek, timeSlot);
    if (!rule) return { price: basePrice, appliedRule: null };
    return { price: rule.getEffectivePrice(basePrice), appliedRule: rule };
  }

  recommendAdjustment(currentOccupancy: number, targetOccupancy: number): { multiplier: number; discount: number } {
    if (currentOccupancy < targetOccupancy * 0.5) {
      return { multiplier: 0.85, discount: 0 };
    }
    if (currentOccupancy < targetOccupancy * 0.75) {
      return { multiplier: 0.95, discount: 0 };
    }
    if (currentOccupancy > targetOccupancy * 1.25) {
      return { multiplier: 1.15, discount: 0 };
    }
    if (currentOccupancy > targetOccupancy * 1.5) {
      return { multiplier: 1.25, discount: 0 };
    }
    return { multiplier: 1, discount: 0 };
  }
}
