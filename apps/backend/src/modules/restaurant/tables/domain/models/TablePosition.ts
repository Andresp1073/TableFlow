export class TablePosition {
  private constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  static create(x: number, y: number): TablePosition {
    if (!Number.isFinite(x)) {
      throw new Error("Position X must be a finite number");
    }
    if (!Number.isFinite(y)) {
      throw new Error("Position Y must be a finite number");
    }
    return new TablePosition(x, y);
  }

  static reconstitute(x: number, y: number): TablePosition {
    return new TablePosition(x, y);
  }

  equals(other: TablePosition): boolean {
    return this.x === other.x && this.y === other.y;
  }
}
