export class TableTypeCreated {
  constructor(
    public readonly tableTypeId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly performedBy: string | null,
  ) {}
}

export class TableTypeUpdated {
  constructor(
    public readonly tableTypeId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly performedBy: string | null,
  ) {}
}

export class TableTypeArchived {
  constructor(
    public readonly tableTypeId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly performedBy: string | null,
  ) {}
}
