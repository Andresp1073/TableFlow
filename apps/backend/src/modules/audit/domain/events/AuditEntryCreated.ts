export class AuditEntryCreated {
  constructor(
    public readonly entryId: string,
    public readonly organizationId: string,
    public readonly module: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly action: string,
    public readonly performedBy: string | null,
    public readonly restaurantId: string | null,
  ) {}
}
