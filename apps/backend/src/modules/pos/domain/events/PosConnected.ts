import type { PosConnectionStatus } from "../models/PosConnection.js";

export class PosConnected {
  public readonly eventName = "PosConnected";
  public readonly occurredAt: Date;

  constructor(
    public readonly connectionId: string,
    public readonly providerId: string,
    public readonly restaurantId: string,
    public readonly previousStatus: PosConnectionStatus | null,
  ) {
    this.occurredAt = new Date();
  }
}
