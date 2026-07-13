const MIN_PARTY_SIZE = 1;
const MAX_PARTY_SIZE = 100;

export class PartySize {
  private constructor(public readonly value: number) {}

  static create(value: number): PartySize {
    if (!Number.isInteger(value)) {
      throw new Error("Party size must be an integer");
    }
    if (value < MIN_PARTY_SIZE) {
      throw new Error(`Party size must be at least ${MIN_PARTY_SIZE}, got ${value}`);
    }
    if (value > MAX_PARTY_SIZE) {
      throw new Error(`Party size must not exceed ${MAX_PARTY_SIZE}, got ${value}`);
    }
    return new PartySize(value);
  }

  static reconstitute(value: number): PartySize {
    return new PartySize(value);
  }

  equals(other: PartySize): boolean {
    return this.value === other.value;
  }

  isLargeParty(): boolean {
    return this.value >= 8;
  }
}
