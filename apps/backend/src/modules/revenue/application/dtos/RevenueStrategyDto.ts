import type { RevenueStrategy } from "../../domain/models/RevenueStrategy.js";

export type RevenueStrategyDto = {
  id: string;
  restaurantId: string;
  name: string;
  type: string;
  status: string;
  priceMultiplier: number;
  priceDiscount: number;
  priority: number;
  diningAreaIds: string[];
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
};

export function toRevenueStrategyDto(s: RevenueStrategy): RevenueStrategyDto {
  return {
    id: s.id, restaurantId: s.restaurantId, name: s.name,
    type: s.type, status: s.status,
    priceMultiplier: s.priceMultiplier, priceDiscount: s.priceDiscount,
    priority: s.priority, diningAreaIds: [...s.diningAreaIds],
    validFrom: s.validFrom.toISOString(),
    validTo: s.validTo?.toISOString() ?? null,
    isActive: s.isActive,
  };
}
