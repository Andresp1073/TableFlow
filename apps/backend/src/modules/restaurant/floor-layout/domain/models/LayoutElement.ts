import type { ElementType } from "./ElementType.js";
import type { Position } from "./Position.js";
import type { Dimension } from "./Dimension.js";
import type { Rotation } from "./Rotation.js";
import type { Layer } from "./Layer.js";

export interface LayoutElement {
  id: string;
  type: ElementType;
  referenceId: string | null;
  position: Position;
  dimension: Dimension;
  rotation: Rotation;
  layer: Layer;
  visible: boolean;
  locked: boolean;
  metadata: Record<string, unknown>;
}

export interface CreateLayoutElementData {
  id: string;
  type: ElementType;
  referenceId?: string | null;
  position: Position;
  dimension: Dimension;
  rotation?: Rotation;
  layer?: Layer;
  visible?: boolean;
  locked?: boolean;
  metadata?: Record<string, unknown>;
}
