import type { ReservationRepository, ReservationListFilters } from "../../domain/repositories/ReservationRepository.js";
import type { ReservationFactory } from "../../domain/repositories/ReservationFactory.js";
import type { AuthorizationService } from "../../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../../authorization/domain/models/AuthorizationContext.js";
import type { AuditService } from "../../../../audit/application/services/AuditService.js";
import type { ReservationCacheInvalidator } from "./ReservationCacheInvalidator.js";
import { EventBus } from "../../../../../events/EventBus.js";
import { ReservationNumber } from "../../domain/models/ReservationNumber.js";
import { ReservationDate } from "../../domain/models/ReservationDate.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationSource } from "../../domain/models/ReservationSource.js";
import { ReservationStatus } from "../../domain/models/ReservationStatus.js";
import { ReservationStateMachine } from "../../domain/services/ReservationStateMachine.js";
import { ReservationTimeValidator } from "../../domain/services/ReservationTimeValidator.js";
import { ReservationPolicyValidator } from "../../domain/services/ReservationPolicyValidator.js";
import {
  ReservationCreated,
  ReservationConfirmed,
  ReservationCancelled,
  ReservationCompleted,
} from "../../domain/events/ReservationEvents.js";
import { ReservationMapper } from "../dto/ReservationMapper.js";
import type { ReservationDTO } from "../dto/ReservationDTO.js";
import type { ReservationSummary } from "../dto/ReservationSummary.js";
import type { CreateReservationCommand } from "../commands/CreateReservationCommand.js";
import type { ConfirmReservationCommand } from "../commands/ConfirmReservationCommand.js";
import type { CancelReservationCommand } from "../commands/CancelReservationCommand.js";
import type { CheckInReservationCommand } from "../commands/CheckInReservationCommand.js";
import type { CompleteReservationCommand } from "../commands/CompleteReservationCommand.js";
import type { UpdateReservationCommand } from "../commands/UpdateReservationCommand.js";
import type { GetReservationQuery } from "../queries/GetReservationQuery.js";
import type { ListReservationsQuery } from "../queries/ListReservationsQuery.js";
import type { SearchReservationsQuery } from "../queries/SearchReservationsQuery.js";
import { ReservationNotFoundError } from "../../errors/ReservationNotFoundError.js";
import { ReservationPolicyViolationError } from "../../errors/ReservationPolicyViolationError.js";

type ReservationPermission =
  | "reservations.create"
  | "reservations.read"
  | "reservations.update"
  | "reservations.cancel";

export interface ApplicationMetadata {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class ReservationApplicationService {
  private readonly stateMachine = new ReservationStateMachine();
  private readonly timeValidator = new ReservationTimeValidator();
  private readonly policyValidator = new ReservationPolicyValidator();

  constructor(
    private readonly repository: ReservationRepository,
    private readonly factory: ReservationFactory,
    private readonly authService: AuthorizationService,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    private readonly cacheInvalidator?: ReservationCacheInvalidator,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: ReservationPermission): Promise<void> {
    await this.authService.authorize(auth, permission);
  }

  async create(
    command: CreateReservationCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<ReservationDTO> {
    await this.authorize(auth, "reservations.create");

    const reservationNumber = ReservationNumber.create(command.reservationNumber);
    const date = ReservationDate.create(new Date(command.date));
    const startTime = new Date(command.startTime);
    const endTime = new Date(command.endTime);
    const timeRange = ReservationTimeRange.create(startTime, endTime);
    const partySize = PartySize.create(command.partySize);
    const source = ReservationSource.create(command.source);
    const status = ReservationStatus.create("pending");

    this.timeValidator.validateTimeRange(timeRange);
    this.policyValidator.validateForCreation(partySize, timeRange, source);

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
      createdBy: auth.userId,
    });

    const saved = await this.repository.save(reservation);

    await this.eventBus.emit(
      "ReservationCreated",
      new ReservationCreated(
        saved.id,
        saved.restaurantId,
        saved.reservationNumber.value,
        saved.partySize.value,
        auth.userId,
      ),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "create",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
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

  async confirm(
    command: ConfirmReservationCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<ReservationDTO> {
    await this.authorize(auth, "reservations.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new ReservationNotFoundError(command.id);
    }

    const newStatus = this.stateMachine.confirm(existing.status);

    const updated: typeof existing = {
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
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "confirm",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues: { status: existing.status.value },
      newValues: { status: saved.status.value },
    });

    await this.cacheInvalidator?.invalidateOnStatusChange(command.id, command.restaurantId);

    return ReservationMapper.toDTO(saved);
  }

  async cancel(
    command: CancelReservationCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<ReservationDTO> {
    await this.authorize(auth, "reservations.cancel");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new ReservationNotFoundError(command.id);
    }

    const newStatus = this.stateMachine.cancel(existing.status);

    const updated: typeof existing = {
      ...existing,
      status: newStatus,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "ReservationCancelled",
      new ReservationCancelled(saved.id, saved.restaurantId, saved.reservationNumber.value, auth.userId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "cancel",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues: { status: existing.status.value, cancelledAt: null },
      newValues: { status: saved.status.value, cancelledAt: saved.cancelledAt?.toISOString() ?? null },
    });

    await this.cacheInvalidator?.invalidateOnStatusChange(command.id, command.restaurantId);

    return ReservationMapper.toDTO(saved);
  }

  async checkIn(
    command: CheckInReservationCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<ReservationDTO> {
    await this.authorize(auth, "reservations.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new ReservationNotFoundError(command.id);
    }

    const newStatus = this.stateMachine.checkIn(existing.status);

    const updated: typeof existing = {
      ...existing,
      status: newStatus,
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "check_in",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues: { status: existing.status.value },
      newValues: { status: saved.status.value },
    });

    await this.cacheInvalidator?.invalidateOnStatusChange(command.id, command.restaurantId);

    return ReservationMapper.toDTO(saved);
  }

  async complete(
    command: CompleteReservationCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<ReservationDTO> {
    await this.authorize(auth, "reservations.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new ReservationNotFoundError(command.id);
    }

    const newStatus = this.stateMachine.complete(existing.status);

    const updated: typeof existing = {
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
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "complete",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues: { status: existing.status.value },
      newValues: { status: saved.status.value },
    });

    await this.cacheInvalidator?.invalidateOnStatusChange(command.id, command.restaurantId);

    return ReservationMapper.toDTO(saved);
  }

  async update(
    command: UpdateReservationCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<ReservationDTO> {
    await this.authorize(auth, "reservations.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new ReservationNotFoundError(command.id);
    }

    if (existing.status.isTerminal()) {
      throw new ReservationPolicyViolationError(
        `Cannot update a reservation in terminal status "${existing.status.value}"`,
      );
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

    const customerId = command.customerId !== undefined
      ? command.customerId
      : existing.customerId;

    const tableId = command.tableId !== undefined
      ? command.tableId
      : existing.tableId;

    const tableGroupId = command.tableGroupId !== undefined
      ? command.tableGroupId
      : existing.tableGroupId;

    const notes = command.notes !== undefined ? command.notes : existing.notes;
    const specialRequests = command.specialRequests !== undefined
      ? command.specialRequests
      : existing.specialRequests;

    this.timeValidator.validateTimeRange(timeRange);

    const updated: typeof existing = {
      ...existing,
      date,
      timeRange,
      partySize,
      customerId,
      tableId,
      tableGroupId,
      notes,
      specialRequests,
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "ReservationConfirmed",
      new ReservationConfirmed(saved.id, saved.restaurantId, saved.reservationNumber.value),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "reservation",
      entityId: saved.id,
      action: "update",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
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

  async getById(
    query: GetReservationQuery,
    auth: AuthorizationContext,
  ): Promise<ReservationDTO> {
    await this.authorize(auth, "reservations.read");

    const reservation = await this.repository.findByIdAndRestaurant(query.id, query.restaurantId);
    if (!reservation) {
      throw new ReservationNotFoundError(query.id);
    }

    return ReservationMapper.toDTO(reservation);
  }

  async list(
    query: ListReservationsQuery,
    auth: AuthorizationContext,
  ): Promise<ReservationSummary[]> {
    await this.authorize(auth, "reservations.read");

    const filters: ReservationListFilters = {
      restaurantId: query.restaurantId,
      status: query.status,
      date: query.date ? new Date(query.date) : undefined,
      customerId: query.customerId,
    };

    const reservations = await this.repository.findByFilters(filters);

    return ReservationMapper.toSummaryList(reservations);
  }

  async search(
    query: SearchReservationsQuery,
    auth: AuthorizationContext,
  ): Promise<ReservationSummary[]> {
    await this.authorize(auth, "reservations.read");

    const filters: ReservationListFilters = {
      restaurantId: query.restaurantId,
      status: query.status,
      date: query.date ? new Date(query.date) : undefined,
      customerId: query.customerId,
    };

    let reservations = await this.repository.findByFilters(filters);

    if (query.query) {
      const term = query.query.toLowerCase();
      reservations = reservations.filter((r) => {
        const matchesNumber = r.reservationNumber.value.toLowerCase().includes(term);
        const matchesCustomerId = r.customerId ? r.customerId.toLowerCase().includes(term) : false;
        const matchesNotes = r.notes ? r.notes.toLowerCase().includes(term) : false;
        const matchesRequests = r.specialRequests ? r.specialRequests.toLowerCase().includes(term) : false;
        return matchesNumber || matchesCustomerId || matchesNotes || matchesRequests;
      });
    }

    return ReservationMapper.toSummaryList(reservations);
  }
}
