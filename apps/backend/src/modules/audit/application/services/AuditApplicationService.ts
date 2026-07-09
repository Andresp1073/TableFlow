import type { AuditRepository } from "../../domain/repositories/AuditRepository.js";
import type { AuditFactory } from "../../domain/repositories/AuditFactory.js";
import { AuditAction } from "../../domain/models/AuditAction.js";
import { AuditModule } from "../../domain/models/AuditModule.js";
import { AuditEntryCreated } from "../../domain/events/AuditEntryCreated.js";
import { EventBus } from "../../../../events/EventBus.js";
import { AuditEntryMapper } from "../dto/AuditEntryMapper.js";
import type { AuditEntryDTO, PaginatedAuditEntryDTO } from "../dto/AuditEntryDTO.js";
import type { CreateAuditEntryCommand } from "../commands/CreateAuditEntryCommand.js";
import type { GetAuditEntryQuery } from "../queries/GetAuditEntryQuery.js";
import type { SearchAuditEntriesQuery } from "../queries/SearchAuditEntriesQuery.js";
import type { AuditRecordInput, AuditService } from "./AuditService.js";
import type { AuditPublisher } from "./AuditPublisher.js";
import { AuditEntryNotFoundError } from "../../errors/AuditEntryNotFoundError.js";

export class AuditApplicationService implements AuditService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly factory: AuditFactory,
    private readonly eventBus: EventBus,
    private readonly publisher?: AuditPublisher,
  ) {}

  async record(input: AuditRecordInput): Promise<void> {
    const command: CreateAuditEntryCommand = {
      organizationId: input.organizationId,
      module: input.module,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      performedBy: input.performedBy ?? null,
      restaurantId: input.restaurantId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId ?? null,
      oldValues: input.oldValues ?? null,
      newValues: input.newValues ?? null,
      metadata: input.metadata ?? null,
    };

    const module = AuditModule.create(command.module);
    const action = AuditAction.create(command.action);

    const entry = this.factory.create({
      organizationId: command.organizationId,
      module,
      entityType: command.entityType,
      entityId: command.entityId,
      action,
      performedBy: command.performedBy,
      restaurantId: command.restaurantId,
      ipAddress: command.ipAddress,
      userAgent: command.userAgent,
      requestId: command.requestId,
      oldValues: command.oldValues,
      newValues: command.newValues,
      metadata: command.metadata,
    });

    const saved = await this.repository.save(entry);

    await this.eventBus.emit(
      "AuditEntryCreated",
      new AuditEntryCreated(
        saved.id,
        saved.organizationId,
        saved.module.value,
        saved.entityType,
        saved.entityId,
        saved.action.value,
        saved.performedBy,
        saved.restaurantId,
      ),
    );

    if (this.publisher) {
      await this.publisher.publish(saved).catch(() => {});
    }
  }

  async getById(query: GetAuditEntryQuery): Promise<AuditEntryDTO> {
    const entry = await this.repository.findById(query.id);
    if (!entry || entry.organizationId !== query.organizationId) {
      throw new AuditEntryNotFoundError(query.id);
    }
    return AuditEntryMapper.toDTO(entry);
  }

  async search(query: SearchAuditEntriesQuery): Promise<PaginatedAuditEntryDTO> {
    const result = await this.repository.search({
      organizationId: query.organizationId,
      module: query.module,
      entityType: query.entityType,
      entityId: query.entityId,
      action: query.action,
      performedBy: query.performedBy,
      restaurantId: query.restaurantId,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page,
      limit: query.limit,
    });
    return AuditEntryMapper.toPaginatedDTO(result);
  }
}
