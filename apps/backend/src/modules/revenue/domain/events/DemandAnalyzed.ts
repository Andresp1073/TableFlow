export class DemandAnalyzed {
  constructor(
    public readonly snapshotId: string,
    public readonly restaurantId: string,
    public readonly date: string,
    public readonly timeSlot: string,
    public readonly occupancyRate: number,
    public readonly totalDemand: number,
    public readonly unservedDemand: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
