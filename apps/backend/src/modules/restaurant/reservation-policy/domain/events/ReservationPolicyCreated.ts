import { randomUUID } from "node:crypto";

export class ReservationPolicyCreated {
  public readonly eventName = "ReservationPolicyCreated";
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
