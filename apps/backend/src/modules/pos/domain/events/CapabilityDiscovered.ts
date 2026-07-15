import type { PosCapability } from "../models/PosCapability.js";

export class CapabilityDiscovered {
  public readonly eventName = "CapabilityDiscovered";
  public readonly occurredAt: Date;

  constructor(
    public readonly providerId: string,
    public readonly providerName: string,
    public readonly capability: PosCapability,
    public readonly isSupported: boolean,
  ) {
    this.occurredAt = new Date();
  }
}
