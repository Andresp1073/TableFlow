import type { TableGroupRepository } from "../../domain/repositories/TableGroupRepository.js";
import type { TableGroupFactory } from "../../domain/repositories/TableGroupFactory.js";
import type { AuthorizationService } from "../../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../../authorization/domain/models/AuthorizationContext.js";
import type { AuditService } from "../../../../audit/application/services/AuditService.js";
import type { TableGroupCacheInvalidator } from "./TableGroupCacheInvalidator.js";
import { EventBus } from "../../../../../events/EventBus.js";
import { TableGroupId } from "../../domain/models/TableGroupId.js";
import { TableGroupName } from "../../domain/models/TableGroupName.js";
import { TableGroupStatus } from "../../domain/models/TableGroupStatus.js";
import { DisplayOrder } from "../../domain/models/DisplayOrder.js";
import { TableGroupingPolicy } from "../../domain/services/TableGroupingPolicy.js";
import { GroupCapacityCalculator } from "../../domain/services/GroupCapacityCalculator.js";
import { TableGroupRules } from "../../domain/services/TableGroupRules.js";
import {
  TableGroupCreated,
  TableGroupUpdated,
  TableGroupReleased,
} from "../../domain/events/TableGroupEvents.js";
import { TableGroupMapper } from "../dto/TableGroupMapper.js";
import type { TableGroupDTO } from "../dto/TableGroupDTO.js";
import type { TableGroupSummary } from "../dto/TableGroupSummary.js";
import type { CreateTableGroupCommand } from "../commands/CreateTableGroupCommand.js";
import type { UpdateTableGroupCommand } from "../commands/UpdateTableGroupCommand.js";
import type { ReleaseTableGroupCommand } from "../commands/ReleaseTableGroupCommand.js";
import type { GetTableGroupQuery } from "../queries/GetTableGroupQuery.js";
import type { ListTableGroupsQuery } from "../queries/ListTableGroupsQuery.js";
import { TableGroupNotFoundError } from "../../errors/TableGroupNotFoundError.js";
import { TableGroupValidationError } from "../../errors/TableGroupValidationError.js";

export interface TableInfo {
  id: string;
  restaurantId: string;
  status: { value: string; isArchived?(): boolean };
  maximumCapacity: { value: number };
}

export interface TableRepositoryForGroup {
  findByIdAndRestaurant(id: string, restaurantId: string): Promise<TableInfo | null>;
}

type TableGroupPermission =
  | "restaurants.table-groups.create"
  | "restaurants.table-groups.read"
  | "restaurants.table-groups.release"
  | "restaurants.table-groups.update";

export interface ApplicationMetadata {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class TableGroupApplicationService {
  private readonly groupingPolicy = new TableGroupingPolicy();
  private readonly capacityCalculator = new GroupCapacityCalculator();

  constructor(
    private readonly repository: TableGroupRepository,
    private readonly factory: TableGroupFactory,
    private readonly tableRepository: TableRepositoryForGroup,
    private readonly authService: AuthorizationService,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    private readonly cacheInvalidator?: TableGroupCacheInvalidator,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: TableGroupPermission): Promise<void> {
    await this.authService.authorize(auth, permission);
  }

  async create(
    command: CreateTableGroupCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<TableGroupDTO> {
    await this.authorize(auth, "restaurants.table-groups.create");

    const name = TableGroupName.create(command.name);
    const status = TableGroupStatus.create("active");

    const memberData = command.tableIds.map((tableId, index) => ({
      tableId,
      displayOrder: DisplayOrder.create(index + 1),
      joinedAt: new Date(),
    }));

    this.groupingPolicy.validateMinimumMembers(memberData);
    this.groupingPolicy.validateNoDuplicateTables(memberData);

    const tables = await this.fetchTables(command.tableIds, command.restaurantId);
    this.groupingPolicy.validateSameRestaurant(tables, command.restaurantId);
    this.groupingPolicy.validateNoArchivedTables(tables);
    TableGroupRules.validateTablesStatus(tables);

    const activeGroupTableIds = await this.repository.findActiveGroupTableIds(command.restaurantId);
    this.groupingPolicy.validateTablesNotInActiveGroup(tables, activeGroupTableIds);

    const group = this.factory.create({
      restaurantId: command.restaurantId,
      name,
      description: command.description ?? null,
      status,
      createdBy: auth.userId,
      members: memberData,
    });

    const saved = await this.repository.save(group);

    await this.eventBus.emit(
      "TableGroupCreated",
      new TableGroupCreated(saved.id.value, saved.restaurantId, saved.name.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "table_group",
      entityId: saved.id.value,
      action: "create",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      newValues: {
        name: saved.name.value,
        description: saved.description,
        status: saved.status.value,
        tableCount: saved.members.length,
        tableIds: saved.members.map((m) => m.tableId),
      },
    });

    await this.cacheInvalidator?.invalidateOnCreate(command.restaurantId);

    return TableGroupMapper.toDTO(saved);
  }

  async update(
    command: UpdateTableGroupCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<TableGroupDTO> {
    await this.authorize(auth, "restaurants.table-groups.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new TableGroupNotFoundError(command.id);
    }

    this.groupingPolicy.validateNotTerminal(existing.status);

    const name = command.name !== undefined
      ? TableGroupName.create(command.name)
      : existing.name;

    const description = command.description !== undefined
      ? command.description
      : existing.description;

    let members = existing.members;
    if (command.tableIds !== undefined) {
      const newMemberData = command.tableIds.map((tableId, index) => ({
        tableId,
        displayOrder: DisplayOrder.create(index + 1),
        joinedAt: new Date(),
      }));

      this.groupingPolicy.validateMinimumMembers(newMemberData);
      this.groupingPolicy.validateNoDuplicateTables(newMemberData);

      const tables = await this.fetchTables(command.tableIds, command.restaurantId);
      this.groupingPolicy.validateSameRestaurant(tables, command.restaurantId);
      this.groupingPolicy.validateNoArchivedTables(tables);
      TableGroupRules.validateTablesStatus(tables);

      const activeGroupTableIds = await this.repository.findActiveGroupTableIds(command.restaurantId);
      const otherActiveIds = activeGroupTableIds.filter(
        (tid) => !existing.members.some((m) => m.tableId === tid),
      );
      this.groupingPolicy.validateTablesNotInActiveGroup(tables, otherActiveIds);

      members = newMemberData;
    }

    const oldStatus = existing.status.value;

    const updated: typeof existing = {
      ...existing,
      name,
      description,
      members,
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "TableGroupUpdated",
      new TableGroupUpdated(saved.id.value, saved.restaurantId, saved.name.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "table_group",
      entityId: saved.id.value,
      action: "update",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues: {
        name: existing.name.value,
        description: existing.description,
        status: oldStatus,
        tableIds: existing.members.map((m) => m.tableId),
      },
      newValues: {
        name: saved.name.value,
        description: saved.description,
        status: saved.status.value,
        tableIds: saved.members.map((m) => m.tableId),
      },
    });

    await this.cacheInvalidator?.invalidateOnUpdate(command.id, command.restaurantId);

    return TableGroupMapper.toDTO(saved);
  }

  async release(
    command: ReleaseTableGroupCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<TableGroupDTO> {
    await this.authorize(auth, "restaurants.table-groups.release");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new TableGroupNotFoundError(command.id);
    }

    this.groupingPolicy.validateNotTerminal(existing.status);

    const oldStatus = existing.status.value;

    const updated: typeof existing = {
      ...existing,
      status: TableGroupStatus.create("released"),
      isActive: false,
      releasedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "TableGroupReleased",
      new TableGroupReleased(saved.id.value, saved.restaurantId, saved.name.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "table_group",
      entityId: saved.id.value,
      action: "release",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues: { status: oldStatus },
      newValues: { status: "released", releasedAt: saved.releasedAt?.toISOString() },
    });

    await this.cacheInvalidator?.invalidateOnRelease(command.id, command.restaurantId);

    return TableGroupMapper.toDTO(saved);
  }

  async getById(
    query: GetTableGroupQuery,
    auth: AuthorizationContext,
  ): Promise<TableGroupDTO> {
    await this.authorize(auth, "restaurants.table-groups.read");

    const group = await this.repository.findByIdAndRestaurant(query.id, query.restaurantId);
    if (!group) {
      throw new TableGroupNotFoundError(query.id);
    }

    return TableGroupMapper.toDTO(group);
  }

  async list(
    query: ListTableGroupsQuery,
    auth: AuthorizationContext,
  ): Promise<TableGroupSummary[]> {
    await this.authorize(auth, "restaurants.table-groups.read");

    const groups = await this.repository.findByFilters({
      restaurantId: query.restaurantId,
      status: query.status,
    });

    return TableGroupMapper.toSummaryList(groups);
  }

  private async fetchTables(tableIds: string[], restaurantId: string): Promise<TableInfo[]> {
    const results: TableInfo[] = [];
    for (const tableId of tableIds) {
      const table = await this.tableRepository.findByIdAndRestaurant(tableId, restaurantId);
      if (!table) {
        throw new TableGroupValidationError(
          `Table "${tableId}" not found in restaurant "${restaurantId}"`,
        );
      }
      results.push(table);
    }
    return results;
  }
}
