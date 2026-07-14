import type { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import type { EventBus } from "../../../../events/EventBus.js";
import type { AuditService } from "../../../../audit/application/services/AuditService.js";
import type { ReservationCacheInvalidator } from "../../application/services/ReservationCacheInvalidator.js";
import type { CancelReservationCommand } from "../../application/commands/CancelReservationCommand.js";
import type { ReservationDTO } from "../../application/dto/ReservationDTO.js";
import { ReservationMapper } from "../../application/dto/ReservationMapper.js";
import { ReservationCancelled } from "../../domain/events/ReservationEvents.js";
import { ReservationNotFoundError } from "../../errors/ReservationNotFoundError.js";
import { ReservationStateMachineCoordinator } from "../state-machine/ReservationStateMachineCoordinator.js";
import type { EngineContext } from "../types.js";

export class ReservationCanceller {
  private readonly stateMachineCoordinator = new ReservationStateMachineCoordinator();

  constructor(
    private readonly repository: ReservationRepository,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    private readonly cacheInvalidator?: ReservationCacheInvalidator,
  ) {}

  async execute(
    command: CancelReservationCommand,
    context: EngineContext,
  ): Promise<ReservationDTO> {
    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new ReservationNotFoundError(command.id);
    }

    const newStatus = this.stateMachineCoordinator.cancel(existing.status);

    const updated = {
      ...existing,
      status: newStatus,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "ReservationCancelled",
      new ReservationCancelled(saved.id, saved.restaurantId, saved.reservationNumber.value, context.auth.userId),
    );

    await this.auditService.record({
      organizationId: context.auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "cancel",
      performedBy: context.auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: context.metadata?.ipAddress ?? null,
      userAgent: context.metadata?.userAgent ?? null,
      requestId: context.metadata?.requestId ?? null,
      oldValues: { status: existing.status.value, cancelledAt: null },
      newValues: { status: saved.status.value, cancelledAt: saved.cancelledAt?.toISOString() ?? null },
    });

    await this.cacheInvalidator?.invalidateOnStatusChange(command.id, command.restaurantId);

    return ReservationMapper.toDTO(saved);
  }
}
