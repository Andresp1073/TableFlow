import type { PosConnectionStatus } from "../models/PosConnection.js";

export class PosDisconnected {
  public readonly eventName = "PosDisconnected";
  public readonly occurredAt: Date;

  constructor(
    public readonly connectionId: string,
    public readonly providerId: string,
    public readonly restaurantId: string,
    public readonly previousStatus: PosConnectionStatus,
    public readonly reason: string | null,
  ) {
    this.occurredAt = new Date();
  }
}
