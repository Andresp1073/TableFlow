const MIN_PARTY_SIZE = 1;
const MAX_PARTY_SIZE = 100;

export class PartySize {
  private constructor(public readonly value: number) {}

  static create(value: number): PartySize {
    if (!Number.isInteger(value) || value < MIN_PARTY_SIZE || value > MAX_PARTY_SIZE) {
      throw new Error(`Party size must be an integer between ${MIN_PARTY_SIZE} and ${MAX_PARTY_SIZE}`);
    }
    return new PartySize(value);
  }

  static reconstitute(value: number): PartySize {
    return new PartySize(value);
  }

  equals(other: PartySize): boolean {
    return this.value === other.value;
  }
}
