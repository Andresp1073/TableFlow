import { BusinessError } from "../../../../errors/BusinessError.js";

export class DuplicateReferenceError extends BusinessError {
  constructor(referenceId: string, elementType: string) {
    super(
      `Reference "${referenceId}" of type "${elementType}" is already used by another element`,
      "floor_layout.duplicate_reference",
    );
    this.name = "DuplicateReferenceError";
    Object.setPrototypeOf(this, DuplicateReferenceError.prototype);
  }
}
