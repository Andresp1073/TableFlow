import type { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import type { ReservationFactory } from "../../domain/repositories/ReservationFactory.js";
import type { EventBus } from "../../../../../events/EventBus.js";
import type { AuditService } from "../../../../audit/application/services/AuditService.js";
import type { ReservationCacheInvalidator } from "../../application/services/ReservationCacheInvalidator.js";
import type { AvailabilityService } from "../../application/ports/AvailabilityService.js";
import type { CreateReservationCommand } from "../../application/commands/CreateReservationCommand.js";
import type { ReservationDTO } from "../../application/dto/ReservationDTO.js";
import { ReservationMapper } from "../../application/dto/ReservationMapper.js";
import { ReservationNumber } from "../../domain/models/ReservationNumber.js";
import { ReservationDate } from "../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationSource } from "../../domain/models/ReservationSource.js";
import { ReservationStatus } from "../../domain/models/ReservationStatus.js";
import { ReservationCreated } from "../../domain/events/ReservationEvents.js";
import { ReservationTimeValidator } from "../../domain/services/ReservationTimeValidator.js";
import { ReservationValidator } from "../validation/ReservationValidator.js";
import { ReservationPolicyEvaluator } from "../policy/ReservationPolicyEvaluator.js";
import { ReservationConflictResolver } from "../conflict/ReservationConflictResolver.js";
import { ReservationStateMachineCoordinator } from "../state-machine/ReservationStateMachineCoordinator.js";
import type { EngineContext } from "../types.js";

export class ReservationCreator {
  private readonly timeValidator = new ReservationTimeValidator();
  private readonly validator = new ReservationValidator();
  private readonly policyEvaluator = new ReservationPolicyEvaluator();
  private readonly stateMachineCoordinator = new ReservationStateMachineCoordinator();

  constructor(
    private readonly repository: ReservationRepository,
    private readonly factory: ReservationFactory,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    private readonly availabilityService?: AvailabilityService,
    private readonly conflictResolver?: ReservationConflictResolver,
    private readonly cacheInvalidator?: ReservationCacheInvalidator,
  ) {}

  async execute(
    command: CreateReservationCommand,
    context: EngineContext,
  ): Promise<ReservationDTO> {
    const requestValidation = this.validator.validateCreate(command);
    if (!requestValidation.isValid) {
      throw new Error(`Validation failed: ${requestValidation.errors.join("; ")}`);
    }

    const reservationNumber = ReservationNumber.create(command.reservationNumber);
    const date = ReservationDate.create(new Date(command.date));
    const startTime = new Date(command.startTime);
    const endTime = new Date(command.endTime);
    const timeRange = ReservationTimeRange.create(startTime, endTime);
    const partySize = PartySize.create(command.partySize);
    const source = ReservationSource.create(command.source);
    const status = ReservationStatus.create("pending");

    this.timeValidator.validateTimeRange(timeRange);

    const policyResult = this.policyEvaluator.evaluateForCreation(partySize, timeRange, source);
    if (!policyResult.isValid) {
      throw new Error(`Policy violation: ${policyResult.errors.join("; ")}`);
    }

    if (this.conflictResolver) {
      const conflictResult = await this.conflictResolver.checkForConflicts({
        restaurantId: command.restaurantId,
        date: date.value,
        startTime,
        endTime,
        tableId: command.tableId,
        tableGroupId: command.tableGroupId,
      });
      if (conflictResult.hasConflict) {
        throw new Error(`Conflict detected: ${conflictResult.reason}`);
      }
    }

    if (this.availabilityService) {
      const availabilityCheck = await this.availabilityService.checkAvailability({
        restaurantId: command.restaurantId,
        date: command.date,
        startTime: command.startTime,
        endTime: command.endTime,
        partySize: command.partySize,
        tableId: command.tableId,
      });
      if (!availabilityCheck.available) {
        throw new Error(`Availability check failed: ${availabilityCheck.reason}`);
      }
    }

    const reservation = this.factory.create({
      restaurantId: command.restaurantId,
      reservationNumber,
      customerId: command.customerId ?? null,
      tableId: command.tableId ?? null,
      tableGroupId: command.tableGroupId ?? null,
      date,
      timeRange,
      partySize,
      source,
      notes: command.notes ?? null,
      specialRequests: command.specialRequests ?? null,
      createdBy: context.auth.userId,
    });

    const saved = await this.repository.save(reservation);

    await this.eventBus.emit(
      "ReservationCreated",
      new ReservationCreated(
        saved.id,
        saved.restaurantId,
        saved.reservationNumber.value,
        saved.partySize.value,
        context.auth.userId,
      ),
    );

    await this.auditService.record({
      organizationId: context.auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "create",
      performedBy: context.auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: context.metadata?.ipAddress ?? null,
      userAgent: context.metadata?.userAgent ?? null,
      requestId: context.metadata?.requestId ?? null,
      newValues: {
        reservationNumber: saved.reservationNumber.value,
        partySize: saved.partySize.value,
        date: saved.date.value.toISOString(),
        startTime: saved.timeRange.startTime.toISOString(),
        endTime: saved.timeRange.endTime.toISOString(),
        source: saved.source.value,
      },
    });

    await this.cacheInvalidator?.invalidateOnCreate(command.restaurantId);

    return ReservationMapper.toDTO(saved);
  }
}
