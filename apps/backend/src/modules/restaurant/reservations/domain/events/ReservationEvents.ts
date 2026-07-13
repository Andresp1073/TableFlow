export class ReservationCreated {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly reservationNumber: string,
    public readonly partySize: number,
    public readonly createdBy: string,
  ) {}
}

export class ReservationConfirmed {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly reservationNumber: string,
  ) {}
}

export class ReservationCancelled {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly reservationNumber: string,
    public readonly cancelledBy: string,
  ) {}
}

export class ReservationCompleted {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly reservationNumber: string,
  ) {}
}

export class ReservationNoShow {
  constructor(
    public readonly id: string,
    public readonly restaurantId: string,
    public readonly reservationNumber: string,
  ) {}
}
