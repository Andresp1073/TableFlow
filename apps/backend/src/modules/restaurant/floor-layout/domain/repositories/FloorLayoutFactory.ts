import type { FloorLayout } from "../models/FloorLayout.js";
import type { ElementType } from "../models/ElementType.js";
import type { Position } from "../models/Position.js";
import type { Dimension } from "../models/Dimension.js";
import type { Rotation } from "../models/Rotation.js";
import type { Layer } from "../models/Layer.js";

export interface CreateFloorLayoutData {
  restaurantId: string;
  name: string;
  elements?: Array<{
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
  }>;
}

export interface ReconstituteFloorLayoutData {
  id: string;
  restaurantId: string;
  name: string;
  elements: Array<{
    id: string;
    type: string;
    referenceId: string | null;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    layer: number;
    visible: boolean;
    locked: boolean;
    metadata: Record<string, unknown>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FloorLayoutFactory {
  create(data: CreateFloorLayoutData): FloorLayout;
  reconstitute(data: ReconstituteFloorLayoutData): FloorLayout;
}
