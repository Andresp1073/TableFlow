export class TableGroupCreated {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly createdBy: string,
  ) {}
}

export class TableGroupUpdated {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly updatedBy: string,
  ) {}
}

export class TableGroupReleased {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly releasedBy: string,
  ) {}
}
