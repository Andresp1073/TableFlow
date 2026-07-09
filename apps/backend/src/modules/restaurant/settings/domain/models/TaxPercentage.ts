const MIN_TAX = 0;
const MAX_TAX = 100;

export class TaxPercentage {
  private constructor(public readonly value: number) {}

  static create(value: number): TaxPercentage {
    if (typeof value !== "number" || isNaN(value)) {
      throw new Error("Tax percentage must be a number");
    }
    if (value < MIN_TAX || value > MAX_TAX) {
      throw new Error(
        `Tax percentage must be between ${MIN_TAX} and ${MAX_TAX}`
      );
    }
    return new TaxPercentage(Math.round(value * 100) / 100);
  }

  static reconstitute(value: number): TaxPercentage {
    return new TaxPercentage(value);
  }

  equals(other: TaxPercentage): boolean {
    return this.value === other.value;
  }

  toDecimal(): number {
    return this.value / 100;
  }
}
