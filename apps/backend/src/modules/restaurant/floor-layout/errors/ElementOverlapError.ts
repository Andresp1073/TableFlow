import { BusinessError } from "../../../../errors/BusinessError.js";

export class ElementOverlapError extends BusinessError {
  constructor(elementId: string, otherElementId: string) {
    super(
      `Element "${elementId}" overlaps with element "${otherElementId}"`,
      "floor_layout.element_overlap",
    );
    this.name = "ElementOverlapError";
    Object.setPrototypeOf(this, ElementOverlapError.prototype);
  }
}
