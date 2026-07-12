import { AppError } from "../../../../errors/AppError.js";

export class TableDuplicateQrError extends AppError {
  constructor(qrIdentifier: string) {
    super(409, "table.duplicate_qr", `A table with QR identifier '${qrIdentifier}' already exists in this restaurant`);
    this.name = "TableDuplicateQrError";
    Object.setPrototypeOf(this, TableDuplicateQrError.prototype);
  }
}
