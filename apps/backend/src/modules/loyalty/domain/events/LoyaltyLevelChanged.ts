import { CustomerTier } from "../models/CustomerProfile.js";

export class LoyaltyLevelChanged {
  constructor(
    public readonly customerProfileId: string,
    public readonly restaurantId: string,
    public readonly previousTier: CustomerTier,
    public readonly newTier: CustomerTier,
    public readonly lifetimePoints: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
