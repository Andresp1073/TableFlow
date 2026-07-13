export class Dimension {
  private constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  static create(width: number, height: number): Dimension {
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error("Dimension values must be finite numbers");
    }
    if (width <= 0) {
      throw new Error(`Dimension width must be positive, got ${width}`);
    }
    if (height <= 0) {
      throw new Error(`Dimension height must be positive, got ${height}`);
    }
    return new Dimension(width, height);
  }

  static reconstitute(width: number, height: number): Dimension {
    return new Dimension(width, height);
  }

  equals(other: Dimension): boolean {
    return this.width === other.width && this.height === other.height;
  }

  area(): number {
    return this.width * this.height;
  }
}
