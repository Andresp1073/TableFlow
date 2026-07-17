export class KpiUpdated {
  constructor(
    public readonly kpiRecordId: string,
    public readonly kpiDefinitionId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly value: number,
    public readonly target: number,
    public readonly variance: number,
    public readonly status: string,
    public readonly period: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
