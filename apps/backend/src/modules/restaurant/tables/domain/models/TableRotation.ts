export class TableRotation {
  private constructor(public readonly value: number) {}

  static create(value: number): TableRotation {
    if (!Number.isFinite(value)) {
      throw new Error("Rotation must be a finite number");
    }
    const normalized = ((value % 360) + 360) % 360;
    return new TableRotation(normalized);
  }

  static reconstitute(value: number): TableRotation {
    return new TableRotation(value);
  }

  equals(other: TableRotation): boolean {
    return this.value === other.value;
  }
}
