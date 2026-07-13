const MIN_LAYER = 0;
const MAX_LAYER = 100;

export class Layer {
  private constructor(public readonly value: number) {}

  static create(value: number): Layer {
    if (!Number.isInteger(value)) {
      throw new Error("Layer must be an integer");
    }
    if (value < MIN_LAYER || value > MAX_LAYER) {
      throw new Error(
        `Layer must be between ${MIN_LAYER} and ${MAX_LAYER}, got ${value}`,
      );
    }
    return new Layer(value);
  }

  static reconstitute(value: number): Layer {
    return new Layer(value);
  }

  equals(other: Layer): boolean {
    return this.value === other.value;
  }

  isAbove(other: Layer): boolean {
    return this.value > other.value;
  }

  isBelow(other: Layer): boolean {
    return this.value < other.value;
  }

  static readonly MIN = MIN_LAYER;
  static readonly MAX = MAX_LAYER;
  static readonly DEFAULT = 0 as const;
}
