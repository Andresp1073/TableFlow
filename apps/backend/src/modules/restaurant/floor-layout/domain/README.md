# Floor Layout Domain (Phase 11.7.1)

## Overview
The Floor Layout domain models a restaurant's physical floor plan as a collection of positioned, sized, and layered elements. Each `FloorLayout` is an aggregate root containing `LayoutElement` entities that represent tables, walls, doors, service areas, and other spatial features.

## Value Objects

| VO | Fields | Validation |
|----|--------|------------|
| `ElementType` | `value: "table" \| "dining_area" \| "wall" \| "door" \| "window" \| "bar" \| "kitchen" \| "reception" \| "decoration" \| "emergency_exit"` | One of 10 predefined types |
| `Position` | `x: number, y: number` | Non-negative, finite |
| `Dimension` | `width: number, height: number` | Positive, finite |
| `Rotation` | `degrees: number` | 0–359, finite |
| `Layer` | `value: number` | Integer, 0–100 |

### ElementType Categories
| Category | Types |
|----------|-------|
| **Furniture** | `table`, `dining_area` |
| **Structural** | `wall`, `door`, `window` |
| **Service** | `bar`, `kitchen`, `reception` |
| **Decorative** | `decoration` |
| **Safety** | `emergency_exit` |

## Aggregate: `FloorLayout`

```
FloorLayout {
  id: string
  restaurantId: string
  name: string
  elements: LayoutElement[]
  createdAt: Date
  updatedAt: Date
}
```

Key design decisions:
- One layout per restaurant (enforced at repository level)
- Elements are value-object-like entities within the aggregate
- No hard limit on element count (practical limits at application layer)

## Child Entity: `LayoutElement`

```
LayoutElement {
  id: string                   /* unique within aggregate */
  type: ElementType            /* wall, table, door, etc. */
  referenceId: string | null   /* FK to table, dining area, etc. (nullable) */
  position: Position           /* x, y coordinates */
  dimension: Dimension         /* width, height */
  rotation: Rotation           /* degrees */
  layer: Layer                 /* z-order for rendering */
  visible: boolean             /* visibility toggle */
  locked: boolean              /* prevent accidental moves */
  metadata: Record<string, unknown>  /* extensible properties */
}
```

- `referenceId` links an element to a business entity (e.g., a `RestaurantTable` or `DiningArea`)
- `metadata` supports future extensibility without schema changes

## Domain Services

### `LayoutValidator`
- `validateForCreation(layout)` — full layout validation returning `{ isValid, errors[] }`
- `validateElements(elements)` — validates element list integrity
- `validateElementIntegrity(element)` — throws on invalid element state
- `validateNoDuplicateReferences(elements)` — ensures no two elements reference the same entity

### `LayoutCollisionDetector`
- `detectCollisions(elements)` — returns `{ hasCollision, collisions[] }` for same-layer elements
- `validateNoOverlap(elements)` — throws `ElementOverlapError` on first collision
- Uses AABB (axis-aligned bounding box) overlap detection
- Elements on different layers never collide

### `LayoutOrderingPolicy`
- `reorderElements(elements)` — sorts by layer ascending
- `validateUniqueLayers(elements)` — ensures no two elements share a layer
- `assignLayer(elements, desiredLayer)` — assigns next available layer if desired is taken
- `getTopLayer(elements)` / `getBottomLayer(elements)` — layer range queries

## Domain Errors (typed)

| Error | Code | When thrown |
|-------|------|-------------|
| `InvalidPositionError` | `floor_layout.invalid_position` | Negative or non-finite coordinates |
| `InvalidDimensionError` | `floor_layout.invalid_dimension` | Non-positive or non-finite dimensions |
| `InvalidRotationError` | `floor_layout.invalid_rotation` | Out of range rotation |
| `InvalidLayerError` | `floor_layout.invalid_layer` | Out of range or duplicate layer |
| `ElementOverlapError` | `floor_layout.element_overlap` | Two elements overlap on same layer |
| `DuplicateReferenceError` | `floor_layout.duplicate_reference` | Same reference used by multiple elements |
| `FloorLayoutValidationError` | `floor_layout.validation_failed` | General input validation failure |

## Domain Events (prepared, not published)
- `FloorLayoutCreated` — id, restaurantId, name
- `FloorLayoutUpdated` — id, restaurantId
- `ElementAdded` — layoutId, elementId, elementType, restaurantId
- `ElementRemoved` — layoutId, elementId, restaurantId
- `ElementMoved` — layoutId, elementId, oldX, oldY, newX, newY, restaurantId

## Future Visual Editor Integration
When a visual floor plan editor is added (frontend or canvas-based), the following integration points exist:
1. **Drag & Drop** → `ElementMoved` event + `LayoutCollisionDetector.validateNoOverlap()`
2. **Add Element** → `ElementAdded` event + `LayoutOrderingPolicy.assignLayer()`
3. **Remove Element** → `ElementRemoved` event
4. **Resize Element** → `Dimension.create()` validation
5. **Layer Management** → `LayoutOrderingPolicy.validateUniqueLayers()`

## Repository Interface

```
FloorLayoutRepository {
  save(layout): Promise<FloorLayout>
  update(layout): Promise<FloorLayout>
  findById(id): Promise<FloorLayout | null>
  findByRestaurantId(restaurantId): Promise<FloorLayout | null>
}
```

## Factory Interface

```
FloorLayoutFactory {
  create(data): FloorLayout    // creates new aggregate with validation
  reconstitute(data): FloorLayout  // restores from persistence
}
```
