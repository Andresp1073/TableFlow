import type { TableRepository } from "../../domain/repositories/TableRepository.js";
import type { TableFactory } from "../../domain/repositories/TableFactory.js";
import type { AuthorizationService } from "../../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../../authorization/domain/models/AuthorizationContext.js";
import type { AuditService } from "../../../../audit/application/services/AuditService.js";
import { EventBus } from "../../../../../events/EventBus.js";
import { TableNumber } from "../../domain/models/TableNumber.js";
import { TableName } from "../../domain/models/TableName.js";
import { TableCapacity } from "../../domain/models/TableCapacity.js";
import { TableStatus } from "../../domain/models/TableStatus.js";
import { TablePosition } from "../../domain/models/TablePosition.js";
import { TableRotation } from "../../domain/models/TableRotation.js";
import { QrIdentifier } from "../../domain/models/QrIdentifier.js";
import { TableRules } from "../../domain/services/TableRules.js";
import { TableStatusEngine } from "../../domain/services/TableStatusEngine.js";
import { TableCreated, TableUpdated, TableArchived, TableStatusChanged } from "../../domain/events/TableEvents.js";
import { TableMapper } from "../dto/TableMapper.js";
import type { TableDTO } from "../dto/TableDTO.js";
import type { StatusChangeResultDTO, StatusTransitionDTO } from "../dto/StatusTransitionDTO.js";
import type { CreateTableCommand } from "../commands/CreateTableCommand.js";
import type { UpdateTableCommand } from "../commands/UpdateTableCommand.js";
import type { ArchiveTableCommand } from "../commands/ArchiveTableCommand.js";
import type { ChangeTableStatusCommand } from "../commands/ChangeTableStatusCommand.js";
import type { GetTableQuery } from "../queries/GetTableQuery.js";
import type { ListTablesQuery } from "../queries/ListTablesQuery.js";
import type { GetAvailableTransitionsQuery } from "../queries/GetAvailableTransitionsQuery.js";
import { TableNotFoundError } from "../../errors/TableNotFoundError.js";
import { TableDuplicateNumberError } from "../../errors/TableDuplicateNumberError.js";
import { TableDuplicateNameError } from "../../errors/TableDuplicateNameError.js";
import { TableDuplicateQrError } from "../../errors/TableDuplicateQrError.js";
import { TableStatusTransitionError } from "../../errors/TableStatusTransitionError.js";
import { TableInvalidCapacityRangeError } from "../../errors/TableInvalidCapacityRangeError.js";
import { TableDeletedError } from "../../errors/TableDeletedError.js";
import { TableArchivedModificationError } from "../../errors/TableArchivedModificationError.js";

type TablePermission =
  | "tables.create"
  | "tables.read"
  | "tables.update"
  | "tables.archive"
  | "tables.status.update";

export class TableApplicationService {
  constructor(
    private readonly repository: TableRepository,
    private readonly factory: TableFactory,
    private readonly authService: AuthorizationService,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: TablePermission): Promise<void> {
    await this.authService.authorize(auth, permission);
  }

  async create(
    command: CreateTableCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<TableDTO> {
    await this.authorize(auth, "tables.create");

    const tableNumber = TableNumber.create(command.tableNumber);
    const minimumCapacity = TableCapacity.create(command.minimumCapacity);
    const maximumCapacity = TableCapacity.create(command.maximumCapacity);

    try {
      TableRules.validateCapacityRange(minimumCapacity, maximumCapacity);
    } catch (e) {
      throw new TableInvalidCapacityRangeError((e as Error).message);
    }

    const currentCapacity = command.currentCapacity !== undefined
      ? TableCapacity.create(command.currentCapacity)
      : TableCapacity.create(maximumCapacity.value);

    try {
      TableRules.validateCurrentCapacity(currentCapacity, minimumCapacity, maximumCapacity);
    } catch (e) {
      throw new TableInvalidCapacityRangeError((e as Error).message);
    }

    const existingNumber = await this.repository.findByNumberAndRestaurant(
      tableNumber.value,
      command.restaurantId,
    );
    if (existingNumber) {
      throw new TableDuplicateNumberError(tableNumber.value);
    }

    let name: TableName | null = null;
    if (command.name) {
      name = TableName.create(command.name);
      const existingName = await this.repository.findByNameAndRestaurant(
        name.value,
        command.restaurantId,
      );
      if (existingName) {
        throw new TableDuplicateNameError(name.value);
      }
    }

    let qrIdentifier: QrIdentifier | null = null;
    if (command.qrIdentifier) {
      qrIdentifier = QrIdentifier.create(command.qrIdentifier);
      const existingQr = await this.repository.findByQrIdentifier(
        qrIdentifier.value,
        command.restaurantId,
      );
      if (existingQr) {
        throw new TableDuplicateQrError(qrIdentifier.value);
      }
    }

    const position = command.positionX !== null && command.positionX !== undefined &&
      command.positionY !== null && command.positionY !== undefined
      ? TablePosition.create(command.positionX, command.positionY)
      : null;

    const rotation = command.rotation !== null && command.rotation !== undefined
      ? TableRotation.create(command.rotation)
      : null;

    const table = this.factory.create({
      restaurantId: command.restaurantId,
      branchId: command.branchId,
      diningAreaId: command.diningAreaId ?? null,
      tableTypeId: command.tableTypeId ?? null,
      tableNumber,
      name,
      description: command.description ?? null,
      minimumCapacity,
      maximumCapacity,
      currentCapacity,
      shape: command.shape ?? "rectangle",
      width: command.width ?? 60,
      height: command.height ?? 60,
      position,
      rotation,
      qrIdentifier,
      isReservable: command.isReservable ?? true,
      isAccessible: command.isAccessible ?? true,
      isActive: command.isActive ?? true,
      status: TableStatus.create("available"),
      metadata: command.metadata ?? null,
    });

    const saved = await this.repository.save(table);

    await this.eventBus.emit(
      "TableCreated",
      new TableCreated(saved.id, saved.restaurantId, saved.tableNumber.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "table",
      entityType: "table",
      entityId: saved.id,
      action: "create",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      newValues: {
        tableNumber: saved.tableNumber.value,
        minimumCapacity: saved.minimumCapacity.value,
        maximumCapacity: saved.maximumCapacity.value,
        diningAreaId: saved.diningAreaId,
        tableTypeId: saved.tableTypeId,
      },
    });

    return TableMapper.toDTO(saved);
  }

  async update(
    command: UpdateTableCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<TableDTO> {
    await this.authorize(auth, "tables.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new TableNotFoundError(command.id);
    }

    TableRules.validateNotDeleted(existing.deletedAt);

    const newTableNumber = TableNumber.create(command.tableNumber);
    const newMinCapacity = TableCapacity.create(command.minimumCapacity);
    const newMaxCapacity = TableCapacity.create(command.maximumCapacity);

    try {
      TableRules.validateCapacityRange(newMinCapacity, newMaxCapacity);
    } catch (e) {
      throw new TableInvalidCapacityRangeError((e as Error).message);
    }

    const newCurrentCapacity = command.currentCapacity !== undefined
      ? TableCapacity.create(command.currentCapacity)
      : existing.currentCapacity;

    try {
      TableRules.validateCurrentCapacity(newCurrentCapacity, newMinCapacity, newMaxCapacity);
    } catch (e) {
      throw new TableInvalidCapacityRangeError((e as Error).message);
    }

    if (!existing.tableNumber.equals(newTableNumber)) {
      const dupNumber = await this.repository.findByNumberAndRestaurant(
        newTableNumber.value,
        command.restaurantId,
      );
      if (dupNumber && dupNumber.id !== command.id) {
        throw new TableDuplicateNumberError(newTableNumber.value);
      }
    }

    let newName: TableName | null = existing.name;
    if (command.name !== undefined) {
      if (command.name === null) {
        newName = null;
      } else {
        newName = TableName.create(command.name);
        if (!existing.name?.equals(newName)) {
          const dupName = await this.repository.findByNameAndRestaurant(
            newName.value,
            command.restaurantId,
          );
          if (dupName && dupName.id !== command.id) {
            throw new TableDuplicateNameError(newName.value);
          }
        }
      }
    }

    let newQrIdentifier: QrIdentifier | null = existing.qrIdentifier;
    if (command.qrIdentifier !== undefined) {
      if (command.qrIdentifier === null) {
        newQrIdentifier = null;
      } else {
        newQrIdentifier = QrIdentifier.create(command.qrIdentifier);
        if (!existing.qrIdentifier?.equals(newQrIdentifier)) {
          const dupQr = await this.repository.findByQrIdentifier(
            newQrIdentifier.value,
            command.restaurantId,
          );
          if (dupQr && dupQr.id !== command.id) {
            throw new TableDuplicateQrError(newQrIdentifier.value);
          }
        }
      }
    }

    const newStatus = command.status
      ? TableStatus.create(command.status)
      : existing.status;

    if (!existing.status.equals(newStatus)) {
      try {
        TableRules.validateStatusTransition(existing.status.value, newStatus.value);
      } catch (e) {
        throw new TableStatusTransitionError(existing.status.value, newStatus.value);
      }
    }

    const newPosition = command.positionX !== undefined && command.positionY !== undefined
      ? (command.positionX !== null && command.positionY !== null
          ? TablePosition.create(command.positionX, command.positionY)
          : null)
      : existing.position;

    const newRotation = command.rotation !== undefined
      ? (command.rotation !== null
          ? TableRotation.create(command.rotation)
          : null)
      : existing.rotation;

    const newBranchId = command.branchId ?? existing.branchId;

    const oldValues = {
      tableNumber: existing.tableNumber.value,
      name: existing.name?.value ?? null,
      minimumCapacity: existing.minimumCapacity.value,
      maximumCapacity: existing.maximumCapacity.value,
      currentCapacity: existing.currentCapacity.value,
      status: existing.status.value,
      diningAreaId: existing.diningAreaId,
      tableTypeId: existing.tableTypeId,
      isReservable: existing.isReservable,
      isAccessible: existing.isAccessible,
    };

    const updated: typeof existing = {
      ...existing,
      branchId: newBranchId,
      diningAreaId: command.diningAreaId !== undefined ? command.diningAreaId : existing.diningAreaId,
      tableTypeId: command.tableTypeId !== undefined ? command.tableTypeId : existing.tableTypeId,
      tableNumber: newTableNumber,
      name: newName,
      description: command.description !== undefined ? command.description : existing.description,
      minimumCapacity: newMinCapacity,
      maximumCapacity: newMaxCapacity,
      currentCapacity: newCurrentCapacity,
      shape: command.shape ?? existing.shape,
      width: command.width ?? existing.width,
      height: command.height ?? existing.height,
      position: newPosition,
      rotation: newRotation,
      qrIdentifier: newQrIdentifier,
      isReservable: command.isReservable ?? existing.isReservable,
      isAccessible: command.isAccessible ?? existing.isAccessible,
      isActive: command.isActive ?? existing.isActive,
      status: newStatus,
      metadata: command.metadata !== undefined ? command.metadata : existing.metadata,
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "TableUpdated",
      new TableUpdated(saved.id, saved.restaurantId, saved.tableNumber.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "table",
      entityType: "table",
      entityId: saved.id,
      action: "update",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues,
      newValues: {
        tableNumber: saved.tableNumber.value,
        name: saved.name?.value ?? null,
        minimumCapacity: saved.minimumCapacity.value,
        maximumCapacity: saved.maximumCapacity.value,
        currentCapacity: saved.currentCapacity.value,
        status: saved.status.value,
        diningAreaId: saved.diningAreaId,
        tableTypeId: saved.tableTypeId,
        isReservable: saved.isReservable,
        isAccessible: saved.isAccessible,
      },
    });

    return TableMapper.toDTO(saved);
  }

  async archive(
    command: ArchiveTableCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<TableDTO> {
    await this.authorize(auth, "tables.archive");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new TableNotFoundError(command.id);
    }

    TableRules.validateNotDeleted(existing.deletedAt);

    const oldValues = { isActive: existing.isActive, deletedAt: existing.deletedAt };

    const updated: typeof existing = {
      ...existing,
      isActive: false,
      status: TableStatus.create("out_of_service"),
      deletedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "TableArchived",
      new TableArchived(saved.id, saved.restaurantId, saved.tableNumber.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "table",
      entityType: "table",
      entityId: saved.id,
      action: "archive",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues,
      newValues: { isActive: false, deletedAt: saved.deletedAt?.toISOString() },
    });

    return TableMapper.toDTO(saved);
  }

  async changeStatus(
    command: ChangeTableStatusCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<StatusChangeResultDTO> {
    await this.authorize(auth, "tables.status.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new TableNotFoundError(command.id);
    }

    TableRules.validateNotDeleted(existing.deletedAt);
    TableRules.validateTransitionOnTerminal(existing.status.value);

    const engine = new TableStatusEngine();
    const result = engine.changeStatus(existing, command.status);

    const saved = await this.repository.update(result.table);

    await this.eventBus.emit(
      "TableStatusChanged",
      new TableStatusChanged(
        saved.id,
        saved.restaurantId,
        saved.tableNumber.value,
        result.previousStatus,
        result.newStatus,
        auth.userId,
        command.reason ?? null,
      ),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "table",
      entityType: "table",
      entityId: saved.id,
      action: "status.change",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues: { status: result.previousStatus },
      newValues: { status: result.newStatus, reason: command.reason ?? null },
    });

    return {
      id: saved.id,
      tableNumber: saved.tableNumber.value,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  async getAvailableTransitions(
    query: GetAvailableTransitionsQuery,
    auth: AuthorizationContext,
  ): Promise<StatusTransitionDTO> {
    await this.authorize(auth, "tables.read");

    const existing = await this.repository.findByIdAndRestaurant(query.id, query.restaurantId);
    if (!existing) {
      throw new TableNotFoundError(query.id);
    }

    const engine = new TableStatusEngine();
    const allowed = engine.getAvailableTransitions(existing.status.value);

    return {
      status: existing.status.value,
      allowedTransitions: allowed,
    };
  }

  async getById(
    query: GetTableQuery,
    auth: AuthorizationContext,
  ): Promise<TableDTO> {
    await this.authorize(auth, "tables.read");

    const table = await this.repository.findByIdAndRestaurant(query.id, query.restaurantId);
    if (!table) {
      throw new TableNotFoundError(query.id);
    }

    return TableMapper.toDTO(table);
  }

  async list(
    query: ListTablesQuery,
    auth: AuthorizationContext,
  ): Promise<TableDTO[]> {
    await this.authorize(auth, "tables.read");

    const tables = await this.repository.findByFilters({
      restaurantId: query.restaurantId,
      diningAreaId: query.diningAreaId,
      tableTypeId: query.tableTypeId,
      status: query.status,
      isReservable: query.isReservable,
      isActive: query.isActive ?? true,
      minCapacity: query.minCapacity,
    });

    return TableMapper.toDTOList(tables);
  }
}
