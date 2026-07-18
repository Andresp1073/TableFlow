import type { RestaurantSettingsRepository, RestaurantSettingsFactory } from "../../domain/repositories/index.js";
import type { AuthorizationService } from "../../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../../../events/EventBus.js";
import { RestaurantTimezone } from "../../../domain/models/RestaurantTimezone.js";
import { RestaurantCurrency } from "../../../domain/models/RestaurantCurrency.js";
import { RestaurantLanguage } from "../../../domain/models/RestaurantLanguage.js";
import { DateFormat } from "../../domain/models/DateFormat.js";
import { TimeFormat } from "../../domain/models/TimeFormat.js";
import { ReservationDuration } from "../../domain/models/ReservationDuration.js";
import { TaxPercentage } from "../../domain/models/TaxPercentage.js";
import { ReservationBufferMinutes } from "../../domain/models/ReservationBufferMinutes.js";
import { RestaurantSettingsNotFoundError } from "../../errors/RestaurantSettingsNotFoundError.js";
import { RestaurantSettingsCreated } from "../../domain/events/RestaurantSettingsCreated.js";
import { RestaurantSettingsUpdated } from "../../domain/events/RestaurantSettingsUpdated.js";
import { RestaurantSettingsMapper } from "../mappers/RestaurantSettingsMapper.js";
import type { RestaurantSettingsDTO } from "../dtos/RestaurantSettingsDTO.js";
import type { CreateRestaurantSettingsCommand } from "../commands/CreateRestaurantSettingsCommand.js";
import type { UpdateRestaurantSettingsCommand } from "../commands/UpdateRestaurantSettingsCommand.js";
import type { GetRestaurantSettingsQuery } from "../queries/GetRestaurantSettingsQuery.js";

type SettingsPermission = "restaurants.settings.read" | "restaurants.settings.update";

export class RestaurantSettingsApplicationService {
  constructor(
    private readonly repository: RestaurantSettingsRepository,
    private readonly factory: RestaurantSettingsFactory,
    private readonly authorizationService: AuthorizationService,
    private readonly eventBus: EventBus,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: SettingsPermission): Promise<void> {
    await this.authorizationService.authorize(auth, permission);
  }

  async get(
    query: GetRestaurantSettingsQuery,
    auth: AuthorizationContext,
  ): Promise<RestaurantSettingsDTO> {
    await this.authorize(auth, "restaurants.settings.read");

    const settings = await this.repository.findByRestaurantId(query.restaurantId);

    if (!settings) {
      throw new RestaurantSettingsNotFoundError(query.restaurantId);
    }

    return RestaurantSettingsMapper.toDTO(settings);
  }

  async create(
    command: CreateRestaurantSettingsCommand,
    auth: AuthorizationContext,
  ): Promise<RestaurantSettingsDTO> {
    await this.authorize(auth, "restaurants.settings.update");

    const existing = await this.repository.findByRestaurantId(command.restaurantId);

    if (existing) {
      return this.update(
        { ...command, restaurantId: command.restaurantId },
        auth,
      );
    }

    const timezone = command.timezone
      ? RestaurantTimezone.create(command.timezone)
      : RestaurantTimezone.create("UTC");
    const currency = command.currency
      ? RestaurantCurrency.create(command.currency)
      : RestaurantCurrency.defaultUSD();
    const language = command.language
      ? RestaurantLanguage.create(command.language)
      : RestaurantLanguage.defaultEN();
    const dateFormat = command.dateFormat
      ? DateFormat.create(command.dateFormat)
      : DateFormat.create("YYYY-MM-DD");
    const timeFormat = command.timeFormat
      ? TimeFormat.create(command.timeFormat)
      : TimeFormat.create("HH:mm");
    const taxPercentage = command.taxPercentage !== undefined
      ? TaxPercentage.create(command.taxPercentage)
      : TaxPercentage.create(0);
    const serviceChargePercentage = command.serviceChargePercentage !== undefined
      ? TaxPercentage.create(command.serviceChargePercentage)
      : TaxPercentage.create(0);
    const defaultReservationDuration = command.defaultReservationDuration !== undefined
      ? ReservationDuration.create(command.defaultReservationDuration)
      : ReservationDuration.create(60);
    const reservationBufferMinutes = command.reservationBufferMinutes !== undefined
      ? ReservationBufferMinutes.create(command.reservationBufferMinutes)
      : ReservationBufferMinutes.create(15);

    const settings = this.factory.create({
      restaurantId: command.restaurantId,
      timezone,
      currency,
      language,
      dateFormat,
      timeFormat,
      weekStartsOn: command.weekStartsOn ?? 0,
      taxPercentage,
      serviceChargePercentage,
      defaultReservationDuration,
      reservationBufferMinutes,
      allowWalkIns: command.allowWalkIns ?? true,
      autoConfirmReservations: command.autoConfirmReservations ?? false,
      maxReservationsPerCustomer: command.maxReservationsPerCustomer ?? 10,
      reservationCancellationHours: command.reservationCancellationHours ?? 24,
    });

    const saved = await this.repository.save(settings);

    await this.eventBus.emit(
      "RestaurantSettingsCreated",
      new RestaurantSettingsCreated(saved.id, saved.restaurantId),
    );

    return RestaurantSettingsMapper.toDTO(saved);
  }

  async update(
    command: UpdateRestaurantSettingsCommand,
    auth: AuthorizationContext,
  ): Promise<RestaurantSettingsDTO> {
    await this.authorize(auth, "restaurants.settings.update");

    const existing = await this.repository.findByRestaurantId(command.restaurantId);

    if (!existing) {
      throw new RestaurantSettingsNotFoundError(command.restaurantId);
    }

    const timezone = command.timezone !== undefined
      ? RestaurantTimezone.create(command.timezone)
      : existing.timezone;
    const currency = command.currency !== undefined
      ? RestaurantCurrency.create(command.currency)
      : existing.currency;
    const language = command.language !== undefined
      ? RestaurantLanguage.create(command.language)
      : existing.language;
    const dateFormat = command.dateFormat !== undefined
      ? DateFormat.create(command.dateFormat)
      : existing.dateFormat;
    const timeFormat = command.timeFormat !== undefined
      ? TimeFormat.create(command.timeFormat)
      : existing.timeFormat;
    const taxPercentage = command.taxPercentage !== undefined
      ? TaxPercentage.create(command.taxPercentage)
      : existing.taxPercentage;
    const serviceChargePercentage = command.serviceChargePercentage !== undefined
      ? TaxPercentage.create(command.serviceChargePercentage)
      : existing.serviceChargePercentage;
    const defaultReservationDuration = command.defaultReservationDuration !== undefined
      ? ReservationDuration.create(command.defaultReservationDuration)
      : existing.defaultReservationDuration;
    const reservationBufferMinutes = command.reservationBufferMinutes !== undefined
      ? ReservationBufferMinutes.create(command.reservationBufferMinutes)
      : existing.reservationBufferMinutes;

    const updated: typeof existing = {
      ...existing,
      timezone,
      currency,
      language,
      dateFormat,
      timeFormat,
      weekStartsOn: command.weekStartsOn ?? existing.weekStartsOn,
      taxPercentage,
      serviceChargePercentage,
      defaultReservationDuration,
      reservationBufferMinutes,
      allowWalkIns: command.allowWalkIns ?? existing.allowWalkIns,
      autoConfirmReservations: command.autoConfirmReservations ?? existing.autoConfirmReservations,
      maxReservationsPerCustomer: command.maxReservationsPerCustomer ?? existing.maxReservationsPerCustomer,
      reservationCancellationHours: command.reservationCancellationHours ?? existing.reservationCancellationHours,
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "RestaurantSettingsUpdated",
      new RestaurantSettingsUpdated(saved.id, saved.restaurantId),
    );

    return RestaurantSettingsMapper.toDTO(saved);
  }

  async getOrCreate(
    query: GetRestaurantSettingsQuery,
    auth: AuthorizationContext,
  ): Promise<RestaurantSettingsDTO> {
    const existing = await this.repository.findByRestaurantId(query.restaurantId);

    if (existing) {
      await this.authorize(auth, "restaurants.settings.read");
      return RestaurantSettingsMapper.toDTO(existing);
    }

    return this.create(
      { restaurantId: query.restaurantId },
      auth,
    );
  }
}
