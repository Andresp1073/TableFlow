import { BusinessError } from "../../../../errors/BusinessError.js";

export class InvalidTableGroupError extends BusinessError {
  constructor(message: string) {
    super(message, "table_group.invalid");
    this.name = "InvalidTableGroupError";
    Object.setPrototypeOf(this, InvalidTableGroupError.prototype);
  }
}
