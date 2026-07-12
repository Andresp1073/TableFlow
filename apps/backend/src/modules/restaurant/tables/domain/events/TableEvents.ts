export class TableCreated {
  constructor(
    public readonly tableId: string,
    public readonly restaurantId: string,
    public readonly tableNumber: string,
    public readonly performedBy: string | null,
  ) {}
}

export class TableUpdated {
  constructor(
    public readonly tableId: string,
    public readonly restaurantId: string,
    public readonly tableNumber: string,
    public readonly performedBy: string | null,
  ) {}
}

export class TableArchived {
  constructor(
    public readonly tableId: string,
    public readonly restaurantId: string,
    public readonly tableNumber: string,
    public readonly performedBy: string | null,
  ) {}
}

export class TableStatusChanged {
  constructor(
    public readonly tableId: string,
    public readonly restaurantId: string,
    public readonly tableNumber: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly performedBy: string | null,
    public readonly reason: string | null,
  ) {}
}
