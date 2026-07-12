import type { CreateTableGroupRequest, UpdateTableGroupRequest } from "../dto/TableGroupRequestDTO.js";
import { TableGroupValidationError } from "../../errors/TableGroupValidationError.js";

export class TableGroupValidator {
  validateCreateRequest(request: CreateTableGroupRequest): void {
    if (!request.restaurantId || request.restaurantId.trim() === "") {
      throw new TableGroupValidationError("restaurantId is required");
    }

    if (!request.name || request.name.trim() === "") {
      throw new TableGroupValidationError("name is required");
    }

    if (request.name.trim().length > 100) {
      throw new TableGroupValidationError("name must not exceed 100 characters");
    }

    if (!request.tableIds || request.tableIds.length < 2) {
      throw new TableGroupValidationError("At least 2 table IDs are required");
    }

    if (new Set(request.tableIds).size !== request.tableIds.length) {
      throw new TableGroupValidationError("Duplicate table IDs are not allowed");
    }
  }

  validateUpdateRequest(request: UpdateTableGroupRequest): void {
    if (request.name !== undefined) {
      if (request.name.trim() === "") {
        throw new TableGroupValidationError("name must not be empty");
      }
      if (request.name.trim().length > 100) {
        throw new TableGroupValidationError("name must not exceed 100 characters");
      }
    }

    if (request.tableIds !== undefined) {
      if (request.tableIds.length < 2) {
        throw new TableGroupValidationError("At least 2 table IDs are required");
      }
      if (new Set(request.tableIds).size !== request.tableIds.length) {
        throw new TableGroupValidationError("Duplicate table IDs are not allowed");
      }
    }
  }
}
