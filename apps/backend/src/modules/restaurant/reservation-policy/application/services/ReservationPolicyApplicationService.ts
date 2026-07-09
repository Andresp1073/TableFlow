import type { ReservationPolicyRepository, ReservationPolicyFactory } from "../../domain/repositories/index.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../../events/EventBus.js";
import { PartySize } from "../../domain/models/PartySize.js";
import { ReservationDuration } from "../../domain/models/ReservationDuration.js";
import { AdvanceBookingWindow } from "../../domain/models/AdvanceBookingWindow.js";
import { CancellationDeadline } from "../../domain/models/CancellationDeadline.js";
import { GracePeriod } from "../../domain/models/GracePeriod.js";
import { ReservationPolicyNotFoundError } from "../../errors/ReservationPolicyNotFoundError.js";
import { ReservationPolicyCreated } from "../../domain/events/ReservationPolicyCreated.js";
import { ReservationPolicyUpdated } from "../../domain/events/ReservationPolicyUpdated.js";
import { ReservationPolicyMapper } from "../mappers/ReservationPolicyMapper.js";
import type { ReservationPolicyDTO } from "../dtos/ReservationPolicyDTO.js";
import type { CreateReservationPolicyCommand } from "../commands/CreateReservationPolicyCommand.js";
import type { UpdateReservationPolicyCommand } from "../commands/UpdateReservationPolicyCommand.js";
import type { GetReservationPolicyQuery } from "../queries/GetReservationPolicyQuery.js";

type PolicyPermission = "restaurants.reservation-policy.read" | "restaurants.reservation-policy.update";

export class ReservationPolicyApplicationService {
  constructor(
    private readonly repository: ReservationPolicyRepository,
    private readonly factory: ReservationPolicyFactory,
    private readonly authService: AuthorizationService,
    private readonly eventBus: EventBus,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: PolicyPermission): Promise<void> {
    await this.authService.authorize(auth, permission);
  }

  async get(
    query: GetReservationPolicyQuery,
    auth: AuthorizationContext,
  ): Promise<ReservationPolicyDTO> {
    await this.authorize(auth, "restaurants.reservation-policy.read");

    const policy = await this.repository.findByRestaurantId(query.restaurantId);

    if (!policy) {
      throw new ReservationPolicyNotFoundError(query.restaurantId);
    }

    return ReservationPolicyMapper.toDTO(policy);
  }

  async create(
    command: CreateReservationPolicyCommand,
    auth: AuthorizationContext,
  ): Promise<ReservationPolicyDTO> {
    await this.authorize(auth, "restaurants.reservation-policy.update");

    const minPartySize = PartySize.create(command.minPartySize ?? 1);
    const maxPartySize = PartySize.create(command.maxPartySize ?? 20);
    const defaultReservationDuration = ReservationDuration.create(command.defaultReservationDuration ?? 60);
    const advanceBookingWindow = AdvanceBookingWindow.create(
      command.minAdvanceBookingMinutes ?? 60,
      command.maxAdvanceBookingDays ?? 30,
    );
    const cancellationDeadlineMinutes = CancellationDeadline.create(command.cancellationDeadlineMinutes ?? 1440);
    const modificationDeadlineMinutes = CancellationDeadline.create(command.modificationDeadlineMinutes ?? 1440);
    const gracePeriodMinutes = GracePeriod.create(command.gracePeriodMinutes ?? 15);

    const policy = this.factory.create({
      restaurantId: command.restaurantId,
      enabled: command.enabled ?? true,
      minPartySize,
      maxPartySize,
      defaultReservationDuration,
      advanceBookingWindow,
      cancellationDeadlineMinutes,
      modificationDeadlineMinutes,
      allowWalkIns: command.allowWalkIns ?? true,
      autoConfirmReservations: command.autoConfirmReservations ?? false,
      requireCustomerPhone: command.requireCustomerPhone ?? false,
      requireCustomerEmail: command.requireCustomerEmail ?? true,
      maxActiveReservationsPerCustomer: command.maxActiveReservationsPerCustomer ?? 10,
      gracePeriodMinutes,
    });

    const saved = await this.repository.save(policy);

    await this.eventBus.emit(
      "ReservationPolicyCreated",
      new ReservationPolicyCreated(saved.id, saved.restaurantId),
    );

    return ReservationPolicyMapper.toDTO(saved);
  }

  async update(
    command: UpdateReservationPolicyCommand,
    auth: AuthorizationContext,
  ): Promise<ReservationPolicyDTO> {
    await this.authorize(auth, "restaurants.reservation-policy.update");

    const existing = await this.repository.findByRestaurantId(command.restaurantId);

    if (!existing) {
      throw new ReservationPolicyNotFoundError(command.restaurantId);
    }

    const minPartySize = command.minPartySize !== undefined
      ? PartySize.create(command.minPartySize)
      : existing.minPartySize;
    const maxPartySize = command.maxPartySize !== undefined
      ? PartySize.create(command.maxPartySize)
      : existing.maxPartySize;
    const defaultReservationDuration = command.defaultReservationDuration !== undefined
      ? ReservationDuration.create(command.defaultReservationDuration)
      : existing.defaultReservationDuration;
    const advanceBookingWindow = command.minAdvanceBookingMinutes !== undefined || command.maxAdvanceBookingDays !== undefined
      ? AdvanceBookingWindow.create(
          command.minAdvanceBookingMinutes ?? existing.advanceBookingWindow.minMinutes,
          command.maxAdvanceBookingDays ?? existing.advanceBookingWindow.maxDays,
        )
      : existing.advanceBookingWindow;
    const cancellationDeadlineMinutes = command.cancellationDeadlineMinutes !== undefined
      ? CancellationDeadline.create(command.cancellationDeadlineMinutes)
      : existing.cancellationDeadlineMinutes;
    const modificationDeadlineMinutes = command.modificationDeadlineMinutes !== undefined
      ? CancellationDeadline.create(command.modificationDeadlineMinutes)
      : existing.modificationDeadlineMinutes;
    const gracePeriodMinutes = command.gracePeriodMinutes !== undefined
      ? GracePeriod.create(command.gracePeriodMinutes)
      : existing.gracePeriodMinutes;

    const updated: typeof existing = {
      ...existing,
      enabled: command.enabled ?? existing.enabled,
      minPartySize,
      maxPartySize,
      defaultReservationDuration,
      advanceBookingWindow,
      cancellationDeadlineMinutes,
      modificationDeadlineMinutes,
      allowWalkIns: command.allowWalkIns ?? existing.allowWalkIns,
      autoConfirmReservations: command.autoConfirmReservations ?? existing.autoConfirmReservations,
      requireCustomerPhone: command.requireCustomerPhone ?? existing.requireCustomerPhone,
      requireCustomerEmail: command.requireCustomerEmail ?? existing.requireCustomerEmail,
      maxActiveReservationsPerCustomer: command.maxActiveReservationsPerCustomer ?? existing.maxActiveReservationsPerCustomer,
      gracePeriodMinutes,
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "ReservationPolicyUpdated",
      new ReservationPolicyUpdated(saved.id, saved.restaurantId),
    );

    return ReservationPolicyMapper.toDTO(saved);
  }

  async getOrCreate(
    query: GetReservationPolicyQuery,
    auth: AuthorizationContext,
  ): Promise<ReservationPolicyDTO> {
    const existing = await this.repository.findByRestaurantId(query.restaurantId);

    if (existing) {
      await this.authorize(auth, "restaurants.reservation-policy.read");
      return ReservationPolicyMapper.toDTO(existing);
    }

    return this.create(
      { restaurantId: query.restaurantId },
      auth,
    );
  }
}
