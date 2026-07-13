import type { LayoutElement } from "../models/LayoutElement.js";
import type { FloorLayout } from "../models/FloorLayout.js";
import { DuplicateReferenceError } from "../../errors/DuplicateReferenceError.js";
import { FloorLayoutValidationError } from "../../errors/FloorLayoutValidationError.js";

export interface LayoutValidationResult {
  isValid: boolean;
  errors: string[];
}

export class LayoutValidator {
  validateForCreation(layout: FloorLayout): LayoutValidationResult {
    const errors: string[] = [];

    if (!layout.restaurantId || layout.restaurantId.trim() === "") {
      errors.push("restaurantId is required");
    }

    if (!layout.name || layout.name.trim() === "") {
      errors.push("name is required");
    }

    if (layout.name && layout.name.length > 100) {
      errors.push("name must not exceed 100 characters");
    }

    const elementErrors = this.validateElements(layout.elements);
    errors.push(...elementErrors);

    return { isValid: errors.length === 0, errors };
  }

  validateElements(elements: LayoutElement[]): string[] {
    const errors: string[] = [];

    if (elements.length === 0) {
      errors.push("At least one element is required");
      return errors;
    }

    const elementIds = new Set<string>();
    const referenceIds = new Map<string, string>();

    for (const element of elements) {
      if (elementIds.has(element.id)) {
        errors.push(`Duplicate element id "${element.id}"`);
      }
      elementIds.add(element.id);

      if (!element.type) {
        errors.push(`Element "${element.id}" has no type`);
      }

      if (element.referenceId !== null && element.referenceId !== undefined) {
        const existingType = referenceIds.get(element.referenceId);
        if (existingType) {
          errors.push(
            `Reference "${element.referenceId}" is used by multiple elements (types: "${existingType}", "${element.type.value}")`,
          );
        }
        referenceIds.set(element.referenceId, element.type.value);
      }
    }

    return errors;
  }

  validateElementIntegrity(element: LayoutElement): void {
    if (!element.id || element.id.trim() === "") {
      throw new FloorLayoutValidationError("Element id is required");
    }

    if (element.position.x < 0 || element.position.y < 0) {
      throw new FloorLayoutValidationError(
        `Element "${element.id}" has invalid position (${element.position.x}, ${element.position.y})`,
      );
    }

    if (element.dimension.width <= 0 || element.dimension.height <= 0) {
      throw new FloorLayoutValidationError(
        `Element "${element.id}" has invalid dimensions (${element.dimension.width} x ${element.dimension.height})`,
      );
    }

    if (element.referenceId !== null && element.referenceId !== undefined) {
      const refs = new Map<string, string>();
      if (refs.has(element.referenceId)) {
        throw new DuplicateReferenceError(element.referenceId, element.type.value);
      }
    }
  }

  validateNoDuplicateReferences(elements: LayoutElement[]): void {
    const references = new Map<string, string>();

    for (const element of elements) {
      if (element.referenceId !== null && element.referenceId !== undefined) {
        const existingType = references.get(element.referenceId);
        if (existingType) {
          throw new DuplicateReferenceError(element.referenceId, element.type.value);
        }
        references.set(element.referenceId, element.type.value);
      }
    }
  }
}
