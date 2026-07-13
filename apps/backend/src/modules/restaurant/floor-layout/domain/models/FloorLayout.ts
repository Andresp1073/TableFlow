import type { LayoutElement } from "./LayoutElement.js";

export interface FloorLayout {
  id: string;
  restaurantId: string;
  name: string;
  elements: LayoutElement[];
  createdAt: Date;
  updatedAt: Date;
}
