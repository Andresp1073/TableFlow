import type { ReservationRepository } from "../domain/repositories/ReservationRepository.js";
import type { ReservationFactory } from "../domain/repositories/ReservationFactory.js";
import type { EventBus } from "../../../events/EventBus.js";
import type { AuditService } from "../../../audit/application/services/AuditService.js";
import type { AvailabilityService } from "../application/ports/AvailabilityService.js";
import type { ReservationCacheInvalidator } from "../application/services/ReservationCacheInvalidator.js";
import type { CreateReservationCommand } from "../application/commands/CreateReservationCommand.js";
import type { ConfirmReservationCommand } from "../application/commands/ConfirmReservationCommand.js";
import type { CancelReservationCommand } from "../application/commands/CancelReservationCommand.js";
import type { CheckInReservationCommand } from "../application/commands/CheckInReservationCommand.js";
import type { CompleteReservationCommand } from "../application/commands/CompleteReservationCommand.js";
import type { UpdateReservationCommand } from "../application/commands/UpdateReservationCommand.js";
import type { GetReservationQuery } from "../application/queries/GetReservationQuery.js";
import type { ListReservationsQuery } from "../application/queries/ListReservationsQuery.js";
import type { SearchReservationsQuery } from "../application/queries/SearchReservationsQuery.js";
import type { ReservationDTO } from "../application/dto/ReservationDTO.js";
import type { ReservationSummary } from "../application/dto/ReservationSummary.js";
import { ReservationMapper } from "../application/dto/ReservationMapper.js";
import type { ReservationListFilters } from "../domain/repositories/ReservationRepository.js";
import { ReservationNotFoundError } from "../errors/ReservationNotFoundError.js";
import { ReservationCreator } from "./creator/ReservationCreator.js";
import { ReservationUpdater } from "./updater/ReservationUpdater.js";
import { ReservationCanceller } from "./canceller/ReservationCanceller.js";
import { ReservationConfirmer } from "./confirmer/ReservationConfirmer.js";
import { ReservationCheckIn } from "./check-in/ReservationCheckIn.js";
import { ReservationCompletion } from "./completion/ReservationCompletion.js";
import { ReservationConflictResolver } from "./conflict/ReservationConflictResolver.js";
import type { EngineContext } from "./types.js";

export interface ReservationEngineDependencies {
  repository: ReservationRepository;
  factory: ReservationFactory;
  eventBus: EventBus;
  auditService: AuditService;
  availabilityService?: AvailabilityService;
  cacheInvalidator?: ReservationCacheInvalidator;
}

export class ReservationEngine {
  public readonly creator: ReservationCreator;
  public readonly updater: ReservationUpdater;
  public readonly canceller: ReservationCanceller;
  public readonly confirmer: ReservationConfirmer;
  public readonly checkIn: ReservationCheckIn;
  public readonly completion: ReservationCompletion;
  public readonly conflictResolver: ReservationConflictResolver;

  constructor(private readonly deps: ReservationEngineDependencies) {
    this.conflictResolver = new ReservationConflictResolver(deps.repository);

    this.creator = new ReservationCreator(
      deps.repository,
      deps.factory,
      deps.eventBus,
      deps.auditService,
      deps.availabilityService,
      this.conflictResolver,
      deps.cacheInvalidator,
    );

    this.updater = new ReservationUpdater(
      deps.repository,
      deps.eventBus,
      deps.auditService,
      this.conflictResolver,
      deps.cacheInvalidator,
    );

    this.canceller = new ReservationCanceller(
      deps.repository,
      deps.eventBus,
      deps.auditService,
      deps.cacheInvalidator,
    );

    this.confirmer = new ReservationConfirmer(
      deps.repository,
      deps.eventBus,
      deps.auditService,
      deps.availabilityService,
      deps.cacheInvalidator,
    );

    this.checkIn = new ReservationCheckIn(
      deps.repository,
      deps.auditService,
      deps.cacheInvalidator,
    );

    this.completion = new ReservationCompletion(
      deps.repository,
      deps.eventBus,
      deps.auditService,
      deps.cacheInvalidator,
    );
  }

  async create(command: CreateReservationCommand, context: EngineContext): Promise<ReservationDTO> {
    return this.creator.execute(command, context);
  }

  async update(command: UpdateReservationCommand, context: EngineContext): Promise<ReservationDTO> {
    return this.updater.execute(command, context);
  }

  async cancel(command: CancelReservationCommand, context: EngineContext): Promise<ReservationDTO> {
    return this.canceller.execute(command, context);
  }

  async confirm(command: ConfirmReservationCommand, context: EngineContext): Promise<ReservationDTO> {
    return this.confirmer.execute(command, context);
  }

  async checkInCommand(command: CheckInReservationCommand, context: EngineContext): Promise<ReservationDTO> {
    return this.checkIn.execute(command, context);
  }

  async complete(command: CompleteReservationCommand, context: EngineContext): Promise<ReservationDTO> {
    return this.completion.execute(command, context);
  }

  async getById(query: GetReservationQuery): Promise<ReservationDTO> {
    const reservation = await this.deps.repository.findByIdAndRestaurant(query.id, query.restaurantId);
    if (!reservation) {
      throw new ReservationNotFoundError(query.id);
    }
    return ReservationMapper.toDTO(reservation);
  }

  async list(query: ListReservationsQuery): Promise<ReservationSummary[]> {
    const filters: ReservationListFilters = {
      restaurantId: query.restaurantId,
      status: query.status,
      date: query.date ? new Date(query.date) : undefined,
      customerId: query.customerId,
    };
    const reservations = await this.deps.repository.findByFilters(filters);
    return ReservationMapper.toSummaryList(reservations);
  }

  async search(query: SearchReservationsQuery): Promise<ReservationSummary[]> {
    const filters: ReservationListFilters = {
      restaurantId: query.restaurantId,
      status: query.status,
      date: query.date ? new Date(query.date) : undefined,
      customerId: query.customerId,
    };
    let reservations = await this.deps.repository.findByFilters(filters);

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
