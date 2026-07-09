import { randomUUID } from "node:crypto";

export class ReservationPolicyUpdated {
  public readonly eventName = "ReservationPolicyUpdated";
  public readonly occurredAt: Date;

  constructor(
    public readonly policyId: string,
    public readonly restaurantId: string,
  ) {
    this.id = randomUUID();
    this.occurredAt = new Date();
  }

  public readonly id: string;
}
