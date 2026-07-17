export class ReportGenerated {
  constructor(
    public readonly reportId: string,
    public readonly restaurantId: string,
    public readonly definitionId: string | undefined,
    public readonly name: string,
    public readonly type: string,
    public readonly format: string,
    public readonly recordCount: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
