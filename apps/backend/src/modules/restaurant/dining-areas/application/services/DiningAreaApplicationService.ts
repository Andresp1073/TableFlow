import type { DiningAreaRepository } from "../../domain/repositories/DiningAreaRepository.js";
import type { DiningAreaFactory } from "../../domain/repositories/DiningAreaFactory.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import type { AuditService } from "../../../audit/application/services/AuditService.js";
import { EventBus } from "../../../../events/EventBus.js";
import { DiningAreaName } from "../../domain/models/DiningAreaName.js";
import { DiningAreaCode } from "../../domain/models/DiningAreaCode.js";
import { DisplayOrder } from "../../domain/models/DisplayOrder.js";
import { DiningAreaStatus } from "../../domain/models/DiningAreaStatus.js";
import { DiningAreaRules } from "../../domain/services/DiningAreaRules.js";
import { DiningAreaCreated, DiningAreaUpdated, DiningAreaArchived } from "../../domain/events/DiningAreaEvents.js";
import { DiningAreaMapper } from "../dto/DiningAreaMapper.js";
import type { DiningAreaDTO } from "../dto/DiningAreaDTO.js";
import type { CreateDiningAreaCommand } from "../commands/CreateDiningAreaCommand.js";
import type { UpdateDiningAreaCommand } from "../commands/UpdateDiningAreaCommand.js";
import type { ArchiveDiningAreaCommand } from "../commands/ArchiveDiningAreaCommand.js";
import type { GetDiningAreaQuery } from "../queries/GetDiningAreaQuery.js";
import type { ListDiningAreasQuery } from "../queries/ListDiningAreasQuery.js";
import { DiningAreaNotFoundError } from "../../errors/DiningAreaNotFoundError.js";
import { DiningAreaDuplicateNameError } from "../../errors/DiningAreaDuplicateNameError.js";
import { DiningAreaDuplicateCodeError } from "../../errors/DiningAreaDuplicateCodeError.js";
import { DiningAreaStatusTransitionError } from "../../errors/DiningAreaStatusTransitionError.js";

type DiningAreaPermission =
  | "restaurants.dining-areas.create"
  | "restaurants.dining-areas.read"
  | "restaurants.dining-areas.update"
  | "restaurants.dining-areas.archive";

export class DiningAreaApplicationService {
  constructor(
    private readonly repository: DiningAreaRepository,
    private readonly factory: DiningAreaFactory,
    private readonly authService: AuthorizationService,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: DiningAreaPermission): Promise<void> {
    await this.authService.authorize(auth, permission);
  }

  async create(
    command: CreateDiningAreaCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<DiningAreaDTO> {
    await this.authorize(auth, "restaurants.dining-areas.create");

    const name = DiningAreaName.create(command.name);
    const code = DiningAreaCode.create(command.code);
    const displayOrder = command.displayOrder !== undefined
      ? DisplayOrder.create(command.displayOrder)
      : DisplayOrder.create(await this.repository.findMaxDisplayOrder(command.restaurantId) + 1);
    const status = DiningAreaStatus.create("active");

    const existingName = await this.repository.findByNameAndRestaurant(name.value, command.restaurantId);
    if (existingName) {
      throw new DiningAreaDuplicateNameError(name.value);
    }

    const existingCode = await this.repository.findByCodeAndRestaurant(code.value, command.restaurantId);
    if (existingCode) {
      throw new DiningAreaDuplicateCodeError(code.value);
    }

    const area = this.factory.create({
      restaurantId: command.restaurantId,
      name,
      code,
      description: command.description ?? null,
      displayOrder,
      status,
      isReservable: command.isReservable ?? true,
    });

    const saved = await this.repository.save(area);

    await this.eventBus.emit(
      "DiningAreaCreated",
      new DiningAreaCreated(saved.id, saved.restaurantId, saved.name.value, saved.code.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "dining_area",
      entityId: saved.id,
      action: "create",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      newValues: { name: saved.name.value, code: saved.code.value, displayOrder: saved.displayOrder.value },
    });

    return DiningAreaMapper.toDTO(saved);
  }

  async update(
    command: UpdateDiningAreaCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<DiningAreaDTO> {
    await this.authorize(auth, "restaurants.dining-areas.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new DiningAreaNotFoundError(command.id);
    }

    DiningAreaRules.validateNotArchived(existing.status.value);

    const newName = DiningAreaName.create(command.name);
    const newCode = DiningAreaCode.create(command.code);
    const newDisplayOrder = command.displayOrder !== undefined
      ? DisplayOrder.create(command.displayOrder)
      : existing.displayOrder;

    if (!existing.name.equals(newName)) {
      const dupName = await this.repository.findByNameAndRestaurant(newName.value, command.restaurantId);
      if (dupName && dupName.id !== command.id) {
        throw new DiningAreaDuplicateNameError(newName.value);
      }
    }

    if (!existing.code.equals(newCode)) {
      const dupCode = await this.repository.findByCodeAndRestaurant(newCode.value, command.restaurantId);
      if (dupCode && dupCode.id !== command.id) {
        throw new DiningAreaDuplicateCodeError(newCode.value);
      }
    }

    const oldValues = { name: existing.name.value, code: existing.code.value, description: existing.description, displayOrder: existing.displayOrder.value, isReservable: existing.isReservable };

    const updated: typeof existing = {
      ...existing,
      name: newName,
      code: newCode,
      description: command.description !== undefined ? command.description : existing.description,
      displayOrder: newDisplayOrder,
      isReservable: command.isReservable ?? existing.isReservable,
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "DiningAreaUpdated",
      new DiningAreaUpdated(saved.id, saved.restaurantId, saved.name.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "dining_area",
      entityId: saved.id,
      action: "update",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues,
      newValues: { name: saved.name.value, code: saved.code.value, description: saved.description, displayOrder: saved.displayOrder.value, isReservable: saved.isReservable },
    });

    return DiningAreaMapper.toDTO(saved);
  }

  async archive(
    command: ArchiveDiningAreaCommand,
    auth: AuthorizationContext,
    metadata?: { ipAddress?: string; userAgent?: string; requestId?: string },
  ): Promise<DiningAreaDTO> {
    await this.authorize(auth, "restaurants.dining-areas.archive");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new DiningAreaNotFoundError(command.id);
    }

    const newStatus = DiningAreaStatus.create("archived");

    if (!existing.status.canTransitionTo(newStatus)) {
      throw new DiningAreaStatusTransitionError(existing.status.value, newStatus.value);
    }

    const oldValues = { status: existing.status.value };

    const updated: typeof existing = {
      ...existing,
      status: newStatus,
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "DiningAreaArchived",
      new DiningAreaArchived(saved.id, saved.restaurantId, saved.name.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "dining_area",
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

    return DiningAreaMapper.toDTO(saved);
  }

  async getById(
    query: GetDiningAreaQuery,
    auth: AuthorizationContext,
  ): Promise<DiningAreaDTO> {
    await this.authorize(auth, "restaurants.dining-areas.read");

    const area = await this.repository.findByIdAndRestaurant(query.id, query.restaurantId);
    if (!area) {
      throw new DiningAreaNotFoundError(query.id);
    }

    return DiningAreaMapper.toDTO(area);
  }

  async list(
    query: ListDiningAreasQuery,
    auth: AuthorizationContext,
  ): Promise<DiningAreaDTO[]> {
    await this.authorize(auth, "restaurants.dining-areas.read");

    const areas = await this.repository.findByRestaurantId(query.restaurantId);

    if (query.status) {
      const filtered = areas.filter((a) => a.status.value === query.status);
      return DiningAreaMapper.toDTOList(filtered);
    }

    return DiningAreaMapper.toDTOList(areas);
  }
}
