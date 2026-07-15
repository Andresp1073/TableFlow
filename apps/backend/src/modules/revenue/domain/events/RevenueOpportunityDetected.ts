export class RevenueOpportunityDetected {
  constructor(
    public readonly restaurantId: string,
    public readonly timeSlot: string,
    public readonly date: string,
    public readonly opportunityType: string,
    public readonly estimatedRevenueGain: number,
    public readonly currentOccupancy: number,
    public readonly suggestion: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
