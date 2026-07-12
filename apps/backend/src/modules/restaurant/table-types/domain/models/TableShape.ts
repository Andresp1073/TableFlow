const VALID_SHAPES = ["square", "rectangle", "round", "oval", "custom"] as const;

export type TableShapeValue = (typeof VALID_SHAPES)[number];

export class TableShape {
  private constructor(public readonly value: TableShapeValue) {}

  static create(value: string): TableShape {
    const normalized = value.trim().toLowerCase();
    if (!VALID_SHAPES.includes(normalized as TableShapeValue)) {
      throw new Error(
        `Invalid table shape "${value}". Allowed: ${VALID_SHAPES.join(", ")}`,
      );
    }
    return new TableShape(normalized as TableShapeValue);
  }

  static reconstitute(value: string): TableShape {
    return new TableShape(value as TableShapeValue);
  }

  equals(other: TableShape): boolean {
    return this.value === other.value;
  }

  static readonly SQUARE = "square" as const;
  static readonly RECTANGLE = "rectangle" as const;
  static readonly ROUND = "round" as const;
  static readonly OVAL = "oval" as const;
  static readonly CUSTOM = "custom" as const;
}
