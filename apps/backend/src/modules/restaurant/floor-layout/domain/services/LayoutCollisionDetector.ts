import type { LayoutElement } from "../models/LayoutElement.js";
import { ElementOverlapError } from "../../errors/ElementOverlapError.js";

export interface CollisionResult {
  hasCollision: boolean;
  collisions: Array<{
    elementId: string;
    collidesWith: string;
  }>;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class LayoutCollisionDetector {
  detectCollisions(elements: LayoutElement[]): CollisionResult {
    const collisions: CollisionResult["collisions"] = [];
    const checked = new Set<string>();

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const a = elements[i];
        const b = elements[j];

        if (!a.layer.equals(b.layer)) {
          continue;
        }

        if (this.doOverlap(this.toBoundingBox(a), this.toBoundingBox(b))) {
          const pairKey = [a.id, b.id].sort().join(":");
          if (!checked.has(pairKey)) {
            checked.add(pairKey);
            collisions.push({ elementId: a.id, collidesWith: b.id });
          }
        }
      }
    }

    return { hasCollision: collisions.length > 0, collisions };
  }

  validateNoOverlap(elements: LayoutElement[]): void {
    const result = this.detectCollisions(elements);
    if (result.hasCollision) {
      const first = result.collisions[0];
      throw new ElementOverlapError(first.elementId, first.collidesWith);
    }
  }

  private toBoundingBox(element: LayoutElement): BoundingBox {
    return {
      x: element.position.x,
      y: element.position.y,
      width: element.dimension.width,
      height: element.dimension.height,
    };
  }

  private doOverlap(a: BoundingBox, b: BoundingBox): boolean {
    const aLeft = a.x;
    const aRight = a.x + a.width;
    const aTop = a.y;
    const aBottom = a.y + a.height;

    const bLeft = b.x;
    const bRight = b.x + b.width;
    const bTop = b.y;
    const bBottom = b.y + b.height;

    return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
  }
}
