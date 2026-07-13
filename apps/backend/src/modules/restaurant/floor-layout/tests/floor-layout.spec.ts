import { describe, it, expect } from "vitest";
import { ElementType } from "../domain/models/ElementType.js";
import { Position } from "../domain/models/Position.js";
import { Dimension } from "../domain/models/Dimension.js";
import { Rotation } from "../domain/models/Rotation.js";
import { Layer } from "../domain/models/Layer.js";
import { LayoutValidator } from "../domain/services/LayoutValidator.js";
import { LayoutCollisionDetector } from "../domain/services/LayoutCollisionDetector.js";
import { LayoutOrderingPolicy } from "../domain/services/LayoutOrderingPolicy.js";
import { ElementOverlapError } from "../errors/ElementOverlapError.js";
import { DuplicateReferenceError } from "../errors/DuplicateReferenceError.js";
import { InvalidLayerError } from "../errors/InvalidLayerError.js";

function createElement(overrides?: Record<string, unknown>): any {
  return {
    id: "elem-1",
    type: ElementType.create("table"),
    referenceId: "table-1",
    position: Position.create(10, 20),
    dimension: Dimension.create(100, 80),
    rotation: Rotation.create(0),
    layer: Layer.create(1),
    visible: true,
    locked: false,
    metadata: {},
    ...overrides,
  };
}

function createLayout(overrides?: Record<string, unknown>): any {
  return {
    id: "layout-1",
    restaurantId: "rest-1",
    name: "Main Floor",
    elements: [createElement()],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("ElementType", () => {
  const validTypes = [
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
  ];

  it("creates valid element types", () => {
    for (const type of validTypes) {
      expect(ElementType.create(type).value).toBe(type);
    }
  });

  it("throws for invalid type", () => {
    expect(() => ElementType.create("invalid")).toThrow();
    expect(() => ElementType.create("")).toThrow();
    expect(() => ElementType.create("chair")).toThrow();
  });

  it("normalizes whitespace and case", () => {
    expect(ElementType.create("  TABLE  ").value).toBe("table");
    expect(ElementType.create("Dining Area").value).toBe("dining_area");
    expect(ElementType.create("Emergency Exit").value).toBe("emergency_exit");
  });

  it("checks type categories", () => {
    expect(ElementType.create("table").isTable()).toBe(true);
    expect(ElementType.create("dining_area").isDiningArea()).toBe(true);
    expect(ElementType.create("wall").isStructural()).toBe(true);
    expect(ElementType.create("door").isStructural()).toBe(true);
    expect(ElementType.create("bar").isServiceArea()).toBe(true);
    expect(ElementType.create("decoration").isDecoration()).toBe(true);
    expect(ElementType.create("emergency_exit").isEmergencyExit()).toBe(true);
  });

  it("reconstitutes from stored value", () => {
    expect(ElementType.reconstitute("wall").value).toBe("wall");
  });

  it("checks equality", () => {
    expect(ElementType.create("table").equals(ElementType.create("table"))).toBe(true);
    expect(ElementType.create("table").equals(ElementType.create("wall"))).toBe(false);
  });
});

describe("Position", () => {
  it("creates valid position", () => {
    const pos = Position.create(10, 20);
    expect(pos.x).toBe(10);
    expect(pos.y).toBe(20);
  });

  it("throws for negative coordinates", () => {
    expect(() => Position.create(-1, 0)).toThrow("non-negative");
    expect(() => Position.create(0, -1)).toThrow("non-negative");
  });

  it("throws for non-finite coordinates", () => {
    expect(() => Position.create(NaN, 0)).toThrow();
    expect(() => Position.create(0, Infinity)).toThrow();
  });

  it("allows zero coordinates", () => {
    expect(Position.create(0, 0).x).toBe(0);
    expect(Position.create(0, 0).y).toBe(0);
  });

  it("reconstitutes from stored values", () => {
    const pos = Position.reconstitute(15, 25);
    expect(pos.x).toBe(15);
    expect(pos.y).toBe(25);
  });

  it("checks equality", () => {
    expect(Position.create(1, 2).equals(Position.create(1, 2))).toBe(true);
    expect(Position.create(1, 2).equals(Position.create(3, 4))).toBe(false);
  });

  it("calculates distance", () => {
    const a = Position.create(0, 0);
    const b = Position.create(3, 4);
    expect(a.distanceTo(b)).toBe(5);
  });
});

describe("Dimension", () => {
  it("creates valid dimension", () => {
    const dim = Dimension.create(100, 80);
    expect(dim.width).toBe(100);
    expect(dim.height).toBe(80);
  });

  it("throws for non-positive dimensions", () => {
    expect(() => Dimension.create(0, 10)).toThrow("positive");
    expect(() => Dimension.create(10, 0)).toThrow("positive");
    expect(() => Dimension.create(-1, 10)).toThrow("positive");
  });

  it("throws for non-finite dimensions", () => {
    expect(() => Dimension.create(NaN, 10)).toThrow();
    expect(() => Dimension.create(10, Infinity)).toThrow();
  });

  it("reconstitutes from stored values", () => {
    const dim = Dimension.reconstitute(200, 150);
    expect(dim.width).toBe(200);
    expect(dim.height).toBe(150);
  });

  it("checks equality", () => {
    expect(Dimension.create(1, 2).equals(Dimension.create(1, 2))).toBe(true);
    expect(Dimension.create(1, 2).equals(Dimension.create(3, 4))).toBe(false);
  });

  it("calculates area", () => {
    expect(Dimension.create(10, 20).area()).toBe(200);
  });
});

describe("Rotation", () => {
  it("creates valid rotation", () => {
    expect(Rotation.create(0).degrees).toBe(0);
    expect(Rotation.create(90).degrees).toBe(90);
    expect(Rotation.create(359).degrees).toBe(359);
  });

  it("throws for out of range", () => {
    expect(() => Rotation.create(-1)).toThrow();
    expect(() => Rotation.create(360)).toThrow();
    expect(() => Rotation.create(720)).toThrow();
  });

  it("throws for non-finite", () => {
    expect(() => Rotation.create(NaN)).toThrow();
  });

  it("detects default rotation", () => {
    expect(Rotation.create(0).isDefault()).toBe(true);
    expect(Rotation.create(45).isDefault()).toBe(false);
  });

  it("detects right angles", () => {
    expect(Rotation.create(0).isRightAngle()).toBe(true);
    expect(Rotation.create(90).isRightAngle()).toBe(true);
    expect(Rotation.create(180).isRightAngle()).toBe(true);
    expect(Rotation.create(45).isRightAngle()).toBe(false);
  });

  it("reconstitutes from stored value", () => {
    expect(Rotation.reconstitute(45).degrees).toBe(45);
  });

  it("checks equality", () => {
    expect(Rotation.create(90).equals(Rotation.create(90))).toBe(true);
    expect(Rotation.create(90).equals(Rotation.create(180))).toBe(false);
  });
});

describe("Layer", () => {
  it("creates valid layer", () => {
    expect(Layer.create(0).value).toBe(0);
    expect(Layer.create(50).value).toBe(50);
    expect(Layer.create(100).value).toBe(100);
  });

  it("throws for out of range", () => {
    expect(() => Layer.create(-1)).toThrow();
    expect(() => Layer.create(101)).toThrow();
  });

  it("throws for non-integer", () => {
    expect(() => Layer.create(1.5)).toThrow("integer");
  });

  it("compares layers", () => {
    const lower = Layer.create(1);
    const higher = Layer.create(2);
    expect(higher.isAbove(lower)).toBe(true);
    expect(lower.isBelow(higher)).toBe(true);
    expect(lower.isAbove(higher)).toBe(false);
    expect(higher.isBelow(lower)).toBe(false);
  });

  it("reconstitutes from stored value", () => {
    expect(Layer.reconstitute(5).value).toBe(5);
  });

  it("checks equality", () => {
    expect(Layer.create(1).equals(Layer.create(1))).toBe(true);
    expect(Layer.create(1).equals(Layer.create(2))).toBe(false);
  });
});

describe("LayoutValidator", () => {
  const validator = new LayoutValidator();

  it("validates a complete layout", () => {
    const layout = createLayout();
    const result = validator.validateForCreation(layout);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing restaurantId", () => {
    const layout = createLayout({ restaurantId: "" });
    const result = validator.validateForCreation(layout);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("restaurantId is required");
  });

  it("rejects missing name", () => {
    const layout = createLayout({ name: "" });
    const result = validator.validateForCreation(layout);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("name is required");
  });

  it("rejects name exceeding 100 characters", () => {
    const layout = createLayout({ name: "a".repeat(101) });
    const result = validator.validateForCreation(layout);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("name must not exceed 100 characters");
  });

  it("rejects layout with no elements", () => {
    const layout = createLayout({ elements: [] });
    const result = validator.validateForCreation(layout);
    expect(result.isValid).toBe(false);
  });

  it("detects duplicate element ids", () => {
    const element = createElement();
    const layout = createLayout({ elements: [element, { ...element }] });
    const result = validator.validateForCreation(layout);
    expect(result.isValid).toBe(false);
  });

  it("validates element integrity", () => {
    const element = createElement({ id: "" });
    expect(() => validator.validateElementIntegrity(element)).toThrow("id is required");
  });

  it("detects duplicate references", () => {
    const elements = [
      createElement({ id: "e1", referenceId: "ref-1" }),
      createElement({ id: "e2", referenceId: "ref-1" }),
    ];
    expect(() => validator.validateNoDuplicateReferences(elements)).toThrow(DuplicateReferenceError);
  });

  it("allows null references", () => {
    const elements = [
      createElement({ id: "e1", referenceId: null }),
      createElement({ id: "e2", referenceId: null }),
    ];
    expect(() => validator.validateNoDuplicateReferences(elements)).not.toThrow();
  });
});

describe("LayoutCollisionDetector", () => {
  const detector = new LayoutCollisionDetector();

  it("detects overlapping elements on same layer", () => {
    const elements = [
      createElement({ id: "e1", position: Position.create(0, 0), dimension: Dimension.create(100, 100) }),
      createElement({ id: "e2", position: Position.create(50, 50), dimension: Dimension.create(100, 100) }),
    ];
    const result = detector.detectCollisions(elements);
    expect(result.hasCollision).toBe(true);
    expect(result.collisions).toHaveLength(1);
  });

  it("does not detect collision for non-overlapping elements", () => {
    const elements = [
      createElement({ id: "e1", position: Position.create(0, 0), dimension: Dimension.create(50, 50) }),
      createElement({ id: "e2", position: Position.create(100, 0), dimension: Dimension.create(50, 50) }),
    ];
    const result = detector.detectCollisions(elements);
    expect(result.hasCollision).toBe(false);
  });

  it("does not detect collision for elements on different layers", () => {
    const elements = [
      createElement({ id: "e1", position: Position.create(0, 0), dimension: Dimension.create(100, 100), layer: Layer.create(1) }),
      createElement({ id: "e2", position: Position.create(50, 50), dimension: Dimension.create(100, 100), layer: Layer.create(2) }),
    ];
    const result = detector.detectCollisions(elements);
    expect(result.hasCollision).toBe(false);
  });

  it("detects multiple collisions", () => {
    const elements = [
      createElement({ id: "e1", position: Position.create(0, 0), dimension: Dimension.create(100, 100) }),
      createElement({ id: "e2", position: Position.create(50, 50), dimension: Dimension.create(100, 100) }),
      createElement({ id: "e3", position: Position.create(10, 10), dimension: Dimension.create(20, 20) }),
    ];
    const result = detector.detectCollisions(elements);
    expect(result.hasCollision).toBe(true);
    expect(result.collisions.length).toBeGreaterThanOrEqual(2);
  });

  it("validates no overlap throws on collision", () => {
    const elements = [
      createElement({ id: "e1", position: Position.create(0, 0), dimension: Dimension.create(100, 100) }),
      createElement({ id: "e2", position: Position.create(50, 50), dimension: Dimension.create(100, 100) }),
    ];
    expect(() => detector.validateNoOverlap(elements)).toThrow(ElementOverlapError);
  });

  it("no error when no overlap", () => {
    const elements = [
      createElement({ id: "e1", position: Position.create(0, 0), dimension: Dimension.create(50, 50) }),
      createElement({ id: "e2", position: Position.create(100, 100), dimension: Dimension.create(50, 50) }),
    ];
    expect(() => detector.validateNoOverlap(elements)).not.toThrow();
  });

  it("detects edge-touching elements as non-overlapping", () => {
    const elements = [
      createElement({ id: "e1", position: Position.create(0, 0), dimension: Dimension.create(100, 100) }),
      createElement({ id: "e2", position: Position.create(100, 0), dimension: Dimension.create(100, 100) }),
    ];
    const result = detector.detectCollisions(elements);
    expect(result.hasCollision).toBe(false);
  });
});

describe("LayoutOrderingPolicy", () => {
  const policy = new LayoutOrderingPolicy();

  it("reorders elements by layer ascending", () => {
    const elements = [
      createElement({ id: "e1", layer: Layer.create(3) }),
      createElement({ id: "e2", layer: Layer.create(1) }),
      createElement({ id: "e3", layer: Layer.create(2) }),
    ];
    const ordered = policy.reorderElements(elements);
    expect(ordered[0].id).toBe("e2");
    expect(ordered[1].id).toBe("e3");
    expect(ordered[2].id).toBe("e1");
  });

  it("validates unique layers passes when all layers are unique", () => {
    const elements = [
      createElement({ id: "e1", layer: Layer.create(1) }),
      createElement({ id: "e2", layer: Layer.create(2) }),
    ];
    expect(() => policy.validateUniqueLayers(elements)).not.toThrow();
  });

  it("validates unique layers throws when layers are shared", () => {
    const elements = [
      createElement({ id: "e1", layer: Layer.create(1) }),
      createElement({ id: "e2", layer: Layer.create(1) }),
    ];
    expect(() => policy.validateUniqueLayers(elements)).toThrow(InvalidLayerError);
  });

  it("returns top and bottom layers", () => {
    const elements = [
      createElement({ id: "e1", layer: Layer.create(1) }),
      createElement({ id: "e2", layer: Layer.create(5) }),
      createElement({ id: "e3", layer: Layer.create(3) }),
    ];
    expect(policy.getTopLayer(elements)!.value).toBe(5);
    expect(policy.getBottomLayer(elements)!.value).toBe(1);
  });

  it("returns null for empty list", () => {
    expect(policy.getTopLayer([])).toBeNull();
    expect(policy.getBottomLayer([])).toBeNull();
  });

  it("assigns next available layer when desired layer is taken", () => {
    const existing = [
      createElement({ id: "e1", layer: Layer.create(1) }),
      createElement({ id: "e2", layer: Layer.create(2) }),
    ];
    const newElement = createElement({ id: "e3", layer: Layer.create(0) });
    const assigned = policy.assignLayer(newElement, Layer.create(2), existing);
    expect(assigned.value).toBe(3);
  });

  it("returns desired layer when available", () => {
    const existing = [
      createElement({ id: "e1", layer: Layer.create(1) }),
    ];
    const newElement = createElement({ id: "e2", layer: Layer.create(0) });
    const assigned = policy.assignLayer(newElement, Layer.create(2), existing);
    expect(assigned.value).toBe(2);
  });
});
