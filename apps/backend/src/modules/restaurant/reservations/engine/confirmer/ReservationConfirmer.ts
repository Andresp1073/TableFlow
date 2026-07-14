import type { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import type { EventBus } from "../../../../events/EventBus.js";
import type { AuditService } from "../../../../audit/application/services/AuditService.js";
import type { ReservationCacheInvalidator } from "../../application/services/ReservationCacheInvalidator.js";
import type { AvailabilityService } from "../../application/ports/AvailabilityService.js";
import type { ConfirmReservationCommand } from "../../application/commands/ConfirmReservationCommand.js";
import type { ReservationDTO } from "../../application/dto/ReservationDTO.js";
import { ReservationMapper } from "../../application/dto/ReservationMapper.js";
import { ReservationConfirmed } from "../../domain/events/ReservationEvents.js";
import { ReservationNotFoundError } from "../../errors/ReservationNotFoundError.js";
import { ReservationStateMachineCoordinator } from "../state-machine/ReservationStateMachineCoordinator.js";
import type { EngineContext } from "../types.js";

export class ReservationConfirmer {
  private readonly stateMachineCoordinator = new ReservationStateMachineCoordinator();

  constructor(
    private readonly repository: ReservationRepository,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    private readonly availabilityService?: AvailabilityService,
    private readonly cacheInvalidator?: ReservationCacheInvalidator,
  ) {}

  async execute(
    command: ConfirmReservationCommand,
    context: EngineContext,
  ): Promise<ReservationDTO> {
    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new ReservationNotFoundError(command.id);
    }

    if (this.availabilityService && existing.tableId) {
      const availabilityCheck = await this.availabilityService.checkAvailability({
        restaurantId: command.restaurantId,
        date: existing.date.value.toISOString(),
        startTime: existing.timeRange.startTime.toISOString(),
        endTime: existing.timeRange.endTime.toISOString(),
        partySize: existing.partySize.value,
        tableId: existing.tableId,
      });
      if (!availabilityCheck.available) {
        throw new Error(`Cannot confirm: availability check failed (${availabilityCheck.reason})`);
      }
    }

    const newStatus = this.stateMachineCoordinator.confirm(existing.status);

    const updated = {
      ...existing,
      status: newStatus,
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "ReservationConfirmed",
      new ReservationConfirmed(saved.id, saved.restaurantId, saved.reservationNumber.value),
    );

    await this.auditService.record({
      organizationId: context.auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "confirm",
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
