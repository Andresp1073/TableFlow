export class DiningAreaCreated {
  constructor(
    public readonly diningAreaId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly code: string,
    public readonly performedBy: string | null,
  ) {}
}

export class DiningAreaUpdated {
  constructor(
    public readonly diningAreaId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly performedBy: string | null,
  ) {}
}

export class DiningAreaArchived {
  constructor(
    public readonly diningAreaId: string,
    public readonly restaurantId: string,
    public readonly name: string,
    public readonly performedBy: string | null,
  ) {}
}
