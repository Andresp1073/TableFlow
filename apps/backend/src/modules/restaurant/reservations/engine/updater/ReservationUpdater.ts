import type { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import type { EventBus } from "../../../../events/EventBus.js";
import type { AuditService } from "../../../../audit/application/services/AuditService.js";
import type { ReservationCacheInvalidator } from "../../application/services/ReservationCacheInvalidator.js";
import type { UpdateReservationCommand } from "../../application/commands/UpdateReservationCommand.js";
import type { ReservationDTO } from "../../application/dto/ReservationDTO.js";
import { ReservationMapper } from "../../application/dto/ReservationMapper.js";
import { ReservationDate } from "../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationTimeValidator } from "../../domain/services/ReservationTimeValidator.js";
import { ReservationNotFoundError } from "../../errors/ReservationNotFoundError.js";
import { ReservationValidator } from "../validation/ReservationValidator.js";
import { ReservationConflictResolver } from "../conflict/ReservationConflictResolver.js";
import type { EngineContext } from "../types.js";

export class ReservationUpdater {
  private readonly timeValidator = new ReservationTimeValidator();
  private readonly validator = new ReservationValidator();

  constructor(
    private readonly repository: ReservationRepository,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    private readonly conflictResolver?: ReservationConflictResolver,
    private readonly cacheInvalidator?: ReservationCacheInvalidator,
  ) {}

  async execute(
    command: UpdateReservationCommand,
    context: EngineContext,
  ): Promise<ReservationDTO> {
    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new ReservationNotFoundError(command.id);
    }

    const validation = this.validator.validateUpdate(command, existing);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
    }

    const date = command.date !== undefined
      ? ReservationDate.create(new Date(command.date))
      : existing.date;

    const timeRange = command.startTime !== undefined || command.endTime !== undefined
      ? ReservationTimeRange.create(
          command.startTime ? new Date(command.startTime) : existing.timeRange.startTime,
          command.endTime ? new Date(command.endTime) : existing.timeRange.endTime,
        )
      : existing.timeRange;

    const partySize = command.partySize !== undefined
      ? PartySize.create(command.partySize)
      : existing.partySize;

    this.timeValidator.validateTimeRange(timeRange);

    if (this.conflictResolver) {
      const conflictResult = await this.conflictResolver.findConflictsForUpdate(
        {
          restaurantId: command.restaurantId,
          date: date.value,
          startTime: timeRange.startTime,
          endTime: timeRange.endTime,
          tableId: command.tableId,
          tableGroupId: command.tableGroupId,
          excludeReservationId: command.id,
        },
        existing,
      );
      if (conflictResult.hasConflict) {
        throw new Error(`Conflict detected: ${conflictResult.reason}`);
      }
    }

    const updated = {
      ...existing,
      date,
      timeRange,
      partySize,
      customerId: command.customerId !== undefined ? command.customerId : existing.customerId,
      tableId: command.tableId !== undefined ? command.tableId : existing.tableId,
      tableGroupId: command.tableGroupId !== undefined ? command.tableGroupId : existing.tableGroupId,
      notes: command.notes !== undefined ? command.notes : existing.notes,
      specialRequests: command.specialRequests !== undefined ? command.specialRequests : existing.specialRequests,
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.auditService.record({
      organizationId: context.auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "update",
      performedBy: context.auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: context.metadata?.ipAddress ?? null,
      userAgent: context.metadata?.userAgent ?? null,
      requestId: context.metadata?.requestId ?? null,
      oldValues: {
        date: existing.date.value.toISOString(),
        startTime: existing.timeRange.startTime.toISOString(),
        endTime: existing.timeRange.endTime.toISOString(),
        partySize: existing.partySize.value,
      },
      newValues: {
        date: saved.date.value.toISOString(),
        startTime: saved.timeRange.startTime.toISOString(),
        endTime: saved.timeRange.endTime.toISOString(),
        partySize: saved.partySize.value,
      },
    });

    await this.cacheInvalidator?.invalidateOnUpdate(command.id, command.restaurantId);

    return ReservationMapper.toDTO(saved);
  }
}
