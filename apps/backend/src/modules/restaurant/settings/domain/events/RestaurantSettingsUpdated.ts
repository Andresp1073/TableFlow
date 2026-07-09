import { randomUUID } from "node:crypto";

export class RestaurantSettingsUpdated {
  public readonly eventName = "RestaurantSettingsUpdated";
  public readonly occurredAt: Date;

  constructor(
    public readonly settingsId: string,
    public readonly restaurantId: string,
  ) {
    this.id = randomUUID();
    this.occurredAt = new Date();
  }

  public readonly id: string;
}
