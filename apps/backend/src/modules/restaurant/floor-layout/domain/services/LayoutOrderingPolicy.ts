import type { LayoutElement } from "../models/LayoutElement.js";
import { Layer } from "../models/Layer.js";
import { InvalidLayerError } from "../../errors/InvalidLayerError.js";

export interface LayerAssignment {
  elementId: string;
  layer: Layer;
}

export class LayoutOrderingPolicy {
  assignLayer(
    element: LayoutElement,
    desiredLayer: Layer,
    existingElements: LayoutElement[],
  ): Layer {
    const usedLayers = new Set(existingElements.map((e) => e.layer.value));

    if (usedLayers.has(desiredLayer.value)) {
      return Layer.create(this.findNextAvailableLayer(usedLayers, desiredLayer.value));
    }

    return desiredLayer;
  }

  reorderElements(elements: LayoutElement[]): LayoutElement[] {
    return [...elements].sort((a, b) => a.layer.value - b.layer.value);
  }

  validateUniqueLayers(elements: LayoutElement[]): void {
    const layerCounts = new Map<number, string[]>();

    for (const element of elements) {
      const existing = layerCounts.get(element.layer.value) ?? [];
      existing.push(element.id);
      layerCounts.set(element.layer.value, existing);
    }

    for (const [layer, ids] of layerCounts) {
      if (ids.length > 1) {
        throw new InvalidLayerError(
          `Layer ${layer} is shared by multiple elements: ${ids.join(", ")}`,
        );
      }
    }
  }

  getTopLayer(elements: LayoutElement[]): Layer | null {
    if (elements.length === 0) return null;
    const maxLayer = Math.max(...elements.map((e) => e.layer.value));
    return Layer.reconstitute(maxLayer);
  }

  getBottomLayer(elements: LayoutElement[]): Layer | null {
    if (elements.length === 0) return null;
    const minLayer = Math.min(...elements.map((e) => e.layer.value));
    return Layer.reconstitute(minLayer);
  }

  private findNextAvailableLayer(usedLayers: Set<number>, from: number): number {
    for (let i = from + 1; i <= Layer.MAX; i++) {
      if (!usedLayers.has(i)) {
        return i;
      }
    }
    throw new InvalidLayerError(`No available layer above ${from}`);
  }
}
