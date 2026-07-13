import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidLayerError extends BusinessError {
  constructor(message: string) {
    super(message, "floor_layout.invalid_layer");
    this.name = "InvalidLayerError";
    Object.setPrototypeOf(this, InvalidLayerError.prototype);
  }
}
