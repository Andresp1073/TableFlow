export class Position {
  private constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  static create(x: number, y: number): Position {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error("Position coordinates must be finite numbers");
    }
    if (x < 0) {
      throw new Error(`Position x must be non-negative, got ${x}`);
    }
    if (y < 0) {
      throw new Error(`Position y must be non-negative, got ${y}`);
    }
    return new Position(x, y);
  }

  static reconstitute(x: number, y: number): Position {
    return new Position(x, y);
  }

  equals(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }

  distanceTo(other: Position): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
