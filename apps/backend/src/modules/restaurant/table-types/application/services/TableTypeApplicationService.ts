import type { TableTypeRepository } from "../../domain/repositories/TableTypeRepository.js";
import type { TableTypeFactory } from "../../domain/repositories/TableTypeFactory.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import type { AuditService } from "../../../audit/application/services/AuditService.js";
import { EventBus } from "../../../../events/EventBus.js";
import { TableTypeName } from "../../domain/models/TableTypeName.js";
import { TableTypeCode } from "../../domain/models/TableTypeCode.js";
import { TableCapacity } from "../../domain/models/TableCapacity.js";
import { TableShape } from "../../domain/models/TableShape.js";
import { DisplayOrder } from "../../domain/models/DisplayOrder.js";
import { TableTypeStatus } from "../../domain/models/TableTypeStatus.js";
import { TableTypeRules } from "../../domain/services/TableTypeRules.js";
import { TableTypeCreated, TableTypeUpdated, TableTypeArchived } from "../../domain/events/TableTypeEvents.js";
import { TableTypeMapper } from "../dto/TableTypeMapper.js";
import type { TableTypeDTO } from "../dto/TableTypeDTO.js";
import type { CreateTableTypeCommand } from "../commands/CreateTableTypeCommand.js";
import type { UpdateTableTypeCommand } from "../commands/UpdateTableTypeCommand.js";
import type { ArchiveTableTypeCommand } from "../commands/ArchiveTableTypeCommand.js";
import type { GetTableTypeQuery } from "../queries/GetTableTypeQuery.js";
import type { ListTableTypesQuery } from "../queries/ListTableTypesQuery.js";
import { TableTypeNotFoundError } from "../../errors/TableTypeNotFoundError.js";
import { TableTypeDuplicateNameError } from "../../errors/TableTypeDuplicateNameError.js";
import { TableTypeDuplicateCodeError } from "../../errors/TableTypeDuplicateCodeError.js";
import { TableTypeStatusTransitionError } from "../../errors/TableTypeStatusTransitionError.js";
import { TableTypeInvalidCapacityRangeError } from "../../errors/TableTypeInvalidCapacityRangeError.js";

type TableTypePermission =
  | "table-types.create"
  | "table-types.read"
  | "table-types.update"
  | "table-types.archive";

export class TableTypeApplicationService {
  constructor(
    private readonly repository: TableTypeRepository,
    private readonly factory: TableTypeFactory,
    private readonly authService: AuthorizationService,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: TableTypePermission): Promise<void> {
    await this.authService.authorize(auth, permission);
  }

  async create(
    command: CreateTableTypeCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<TableTypeDTO> {
    await this.authorize(auth, "table-types.create");

    const name = TableTypeName.create(command.name);
    const code = TableTypeCode.create(command.code);
    const defaultCapacity = TableCapacity.create(command.defaultCapacity);
    const minimumCapacity = TableCapacity.create(command.minimumCapacity);
    const maximumCapacity = TableCapacity.create(command.maximumCapacity);

    try {
      TableTypeRules.validateCapacityRange(minimumCapacity, defaultCapacity, maximumCapacity);
    } catch (e) {
      throw new TableTypeInvalidCapacityRangeError((e as Error).message);
    }

    const shape = TableShape.create(command.shape);
    const displayOrder = command.displayOrder !== undefined
      ? DisplayOrder.create(command.displayOrder)
      : DisplayOrder.create(await this.repository.findMaxDisplayOrder(command.restaurantId) + 1);
    const status = TableTypeStatus.create("active");

    const existingName = await this.repository.findByNameAndRestaurant(name.value, command.restaurantId);
    if (existingName) {
      throw new TableTypeDuplicateNameError(name.value);
    }

    const existingCode = await this.repository.findByCodeAndRestaurant(code.value, command.restaurantId);
    if (existingCode) {
      throw new TableTypeDuplicateCodeError(code.value);
    }

    const tableType = this.factory.create({
      restaurantId: command.restaurantId,
      name,
      code,
      description: command.description ?? null,
      defaultCapacity,
      minimumCapacity,
      maximumCapacity,
      shape,
      isReservable: command.isReservable ?? true,
      displayOrder,
      status,
      metadata: command.metadata ?? null,
    });

    const saved = await this.repository.save(tableType);

    await this.eventBus.emit(
      "TableTypeCreated",
      new TableTypeCreated(saved.id, saved.restaurantId, saved.name.value, saved.code.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "table",
      entityType: "table_type",
      entityId: saved.id,
      action: "create",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      newValues: {
        name: saved.name.value,
        code: saved.code.value,
        defaultCapacity: saved.defaultCapacity.value,
        shape: saved.shape.value,
      },
    });

    return TableTypeMapper.toDTO(saved);
  }

  async update(
    command: UpdateTableTypeCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<TableTypeDTO> {
    await this.authorize(auth, "table-types.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new TableTypeNotFoundError(command.id);
    }

    TableTypeRules.validateNotArchived(existing.status.value);

    const newName = TableTypeName.create(command.name);
    const newCode = TableTypeCode.create(command.code);
    const newDefaultCapacity = TableCapacity.create(command.defaultCapacity);
    const newMinimumCapacity = TableCapacity.create(command.minimumCapacity);
    const newMaximumCapacity = TableCapacity.create(command.maximumCapacity);

    try {
      TableTypeRules.validateCapacityRange(newMinimumCapacity, newDefaultCapacity, newMaximumCapacity);
    } catch (e) {
      throw new TableTypeInvalidCapacityRangeError((e as Error).message);
    }

    const newShape = TableShape.create(command.shape);
    const newDisplayOrder = command.displayOrder !== undefined
      ? DisplayOrder.create(command.displayOrder)
      : existing.displayOrder;

    if (!existing.name.equals(newName)) {
      const dupName = await this.repository.findByNameAndRestaurant(newName.value, command.restaurantId);
      if (dupName && dupName.id !== command.id) {
        throw new TableTypeDuplicateNameError(newName.value);
      }
    }

    if (!existing.code.equals(newCode)) {
      const dupCode = await this.repository.findByCodeAndRestaurant(newCode.value, command.restaurantId);
      if (dupCode && dupCode.id !== command.id) {
        throw new TableTypeDuplicateCodeError(newCode.value);
      }
    }

    const oldValues = {
      name: existing.name.value,
      code: existing.code.value,
      description: existing.description,
      defaultCapacity: existing.defaultCapacity.value,
      minimumCapacity: existing.minimumCapacity.value,
      maximumCapacity: existing.maximumCapacity.value,
      shape: existing.shape.value,
      isReservable: existing.isReservable,
      displayOrder: existing.displayOrder.value,
    };

    const updated: typeof existing = {
      ...existing,
      name: newName,
      code: newCode,
      description: command.description !== undefined ? command.description : existing.description,
      defaultCapacity: newDefaultCapacity,
      minimumCapacity: newMinimumCapacity,
      maximumCapacity: newMaximumCapacity,
      shape: newShape,
      displayOrder: newDisplayOrder,
      isReservable: command.isReservable ?? existing.isReservable,
      metadata: command.metadata !== undefined ? command.metadata : existing.metadata,
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "TableTypeUpdated",
      new TableTypeUpdated(saved.id, saved.restaurantId, saved.name.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "table",
      entityType: "table_type",
      entityId: saved.id,
      action: "update",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues,
      newValues: {
        name: saved.name.value,
        code: saved.code.value,
        description: saved.description,
        defaultCapacity: saved.defaultCapacity.value,
        minimumCapacity: saved.minimumCapacity.value,
        maximumCapacity: saved.maximumCapacity.value,
        shape: saved.shape.value,
        isReservable: saved.isReservable,
        displayOrder: saved.displayOrder.value,
      },
    });

    return TableTypeMapper.toDTO(saved);
  }

  async archive(
    command: ArchiveTableTypeCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<TableTypeDTO> {
    await this.authorize(auth, "table-types.archive");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new TableTypeNotFoundError(command.id);
    }

    const newStatus = TableTypeStatus.create("archived");

    if (!existing.status.canTransitionTo(newStatus)) {
      throw new TableTypeStatusTransitionError(existing.status.value, newStatus.value);
    }

    const oldValues = { status: existing.status.value };

    const updated: typeof existing = {
      ...existing,
      status: newStatus,
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "TableTypeArchived",
      new TableTypeArchived(saved.id, saved.restaurantId, saved.name.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "table",
      entityType: "table_type",
      entityId: saved.id,
      action: "archive",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues,
      newValues: { status: saved.status.value },
    });

    return TableTypeMapper.toDTO(saved);
  }

  async getById(
    query: GetTableTypeQuery,
    auth: AuthorizationContext,
  ): Promise<TableTypeDTO> {
    await this.authorize(auth, "table-types.read");

    const tableType = await this.repository.findByIdAndRestaurant(query.id, query.restaurantId);
    if (!tableType) {
      throw new TableTypeNotFoundError(query.id);
    }

    return TableTypeMapper.toDTO(tableType);
  }

  async list(
    query: ListTableTypesQuery,
    auth: AuthorizationContext,
  ): Promise<TableTypeDTO[]> {
    await this.authorize(auth, "table-types.read");

    const types = await this.repository.findByRestaurantId(query.restaurantId);

    if (query.status) {
      const filtered = types.filter((t) => t.status.value === query.status);
      return TableTypeMapper.toDTOList(filtered);
    }

    return TableTypeMapper.toDTOList(types);
  }
}
