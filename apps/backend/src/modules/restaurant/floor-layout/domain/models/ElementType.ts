const VALID_ELEMENT_TYPES = [
  "table",
  "dining_area",
  "wall",
  "door",
  "window",
  "bar",
  "kitchen",
  "reception",
  "decoration",
  "emergency_exit",
] as const;

export type ElementTypeValue = (typeof VALID_ELEMENT_TYPES)[number];

export class ElementType {
  private constructor(public readonly value: ElementTypeValue) {}

  static create(value: string): ElementType {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!VALID_ELEMENT_TYPES.includes(normalized as ElementTypeValue)) {
      throw new Error(
        `Invalid element type "${value}". Allowed: ${VALID_ELEMENT_TYPES.join(", ")}`,
      );
    }
    return new ElementType(normalized as ElementTypeValue);
  }

  static reconstitute(value: string): ElementType {
    return new ElementType(value as ElementTypeValue);
  }

  equals(other: ElementType): boolean {
    return this.value === other.value;
  }

  isTable(): boolean {
    return this.value === "table";
  }

  isDiningArea(): boolean {
    return this.value === "dining_area";
  }

  isStructural(): boolean {
    return ["wall", "door", "window"].includes(this.value);
  }

  isServiceArea(): boolean {
    return ["bar", "kitchen", "reception"].includes(this.value);
  }

  isDecoration(): boolean {
    return this.value === "decoration";
  }

  isEmergencyExit(): boolean {
    return this.value === "emergency_exit";
  }

  static readonly TABLE = "table" as const;
  static readonly DINING_AREA = "dining_area" as const;
  static readonly WALL = "wall" as const;
  static readonly DOOR = "door" as const;
  static readonly WINDOW = "window" as const;
  static readonly BAR = "bar" as const;
  static readonly KITCHEN = "kitchen" as const;
  static readonly RECEPTION = "reception" as const;
  static readonly DECORATION = "decoration" as const;
  static readonly EMERGENCY_EXIT = "emergency_exit" as const;
}
