export class CustomerCreated {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string | null,
    public readonly phone: string | null,
  ) {}
}

export class CustomerUpdated {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
  ) {}
}

export class CustomerArchived {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
  ) {}
}

export class CustomerBlocked {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
  ) {}
}
