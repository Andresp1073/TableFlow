const MIN_DEGREES = 0;
const MAX_DEGREES = 360;

export class Rotation {
  private constructor(public readonly degrees: number) {}

  static create(degrees: number): Rotation {
    if (!Number.isFinite(degrees)) {
      throw new Error("Rotation must be a finite number");
    }
    if (degrees < MIN_DEGREES || degrees >= MAX_DEGREES) {
      throw new Error(
        `Rotation must be between ${MIN_DEGREES} and ${MAX_DEGREES - 1} degrees, got ${degrees}`,
      );
    }
    return new Rotation(degrees);
  }

  static reconstitute(degrees: number): Rotation {
    return new Rotation(degrees);
  }

  equals(other: Rotation): boolean {
    return this.degrees === other.degrees;
  }

  isDefault(): boolean {
    return this.degrees === 0;
  }

  isRightAngle(): boolean {
    return this.degrees % 90 === 0;
  }

  static readonly DEFAULT = 0 as const;
}
