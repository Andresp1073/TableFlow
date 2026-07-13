export class FloorLayoutCreated {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly name: string,
  ) {}
}

export class FloorLayoutUpdated {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
  ) {}
}

export class ElementAdded {
  constructor(
    public readonly layoutId: string,
    public readonly elementId: string,
    public readonly elementType: string,
    public readonly restaurantId: string,
  ) {}
}

export class ElementRemoved {
  constructor(
    public readonly layoutId: string,
    public readonly elementId: string,
    public readonly restaurantId: string,
  ) {}
}

export class ElementMoved {
  constructor(
    public readonly layoutId: string,
    public readonly elementId: string,
    public readonly oldX: number,
    public readonly oldY: number,
    public readonly newX: number,
    public readonly newY: number,
    public readonly restaurantId: string,
  ) {}
}
