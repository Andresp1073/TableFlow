import type { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import type { EventBus } from "../../../../../events/EventBus.js";
import type { AuditService } from "../../../../audit/application/services/AuditService.js";
import type { ReservationCacheInvalidator } from "../../application/services/ReservationCacheInvalidator.js";
import type { CompleteReservationCommand } from "../../application/commands/CompleteReservationCommand.js";
import type { ReservationDTO } from "../../application/dto/ReservationDTO.js";
import { ReservationMapper } from "../../application/dto/ReservationMapper.js";
import { ReservationCompleted } from "../../domain/events/ReservationEvents.js";
import { ReservationNotFoundError } from "../../errors/ReservationNotFoundError.js";
import { ReservationStateMachineCoordinator } from "../state-machine/ReservationStateMachineCoordinator.js";
import type { EngineContext } from "../types.js";

export class ReservationCompletion {
  private readonly stateMachineCoordinator = new ReservationStateMachineCoordinator();

  constructor(
    private readonly repository: ReservationRepository,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    private readonly cacheInvalidator?: ReservationCacheInvalidator,
  ) {}

  async execute(
    command: CompleteReservationCommand,
    context: EngineContext,
  ): Promise<ReservationDTO> {
    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new ReservationNotFoundError(command.id);
    }

    const newStatus = this.stateMachineCoordinator.complete(existing.status);

    const updated = {
      ...existing,
      status: newStatus,
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "ReservationCompleted",
      new ReservationCompleted(saved.id, saved.restaurantId, saved.reservationNumber.value),
    );

    await this.auditService.record({
      organizationId: context.auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "complete",
      performedBy: context.auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: context.metadata?.ipAddress ?? null,
      userAgent: context.metadata?.userAgent ?? null,
      requestId: context.metadata?.requestId ?? null,
      oldValues: { status: existing.status.value },
      newValues: { status: saved.status.value },
    });

    await this.cacheInvalidator?.invalidateOnStatusChange(command.id, command.restaurantId);

    return ReservationMapper.toDTO(saved);
  }
}
