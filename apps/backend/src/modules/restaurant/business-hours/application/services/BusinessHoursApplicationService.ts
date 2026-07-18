import type { BusinessHoursRepository, BusinessHoursFactory } from "../../domain/repositories/index.js";
import type { AuthorizationService } from "../../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../../../events/EventBus.js";
import { DayOfWeek } from "../../domain/models/DayOfWeek.js";
import { OpeningTime } from "../../domain/models/OpeningTime.js";
import { ClosingTime } from "../../domain/models/ClosingTime.js";
import { OpeningPeriod } from "../../domain/models/OpeningPeriod.js";
import { DaySchedule } from "../../domain/models/DaySchedule.js";
import { BusinessHoursNotFoundError } from "../../errors/BusinessHoursNotFoundError.js";
import { BusinessHoursCreated } from "../../domain/events/BusinessHoursCreated.js";
import { BusinessHoursUpdated } from "../../domain/events/BusinessHoursUpdated.js";
import { BusinessHoursMapper } from "../mappers/BusinessHoursMapper.js";
import type { BusinessHoursDTO } from "../dtos/BusinessHoursDTO.js";
import type { CreateBusinessHoursCommand } from "../commands/CreateBusinessHoursCommand.js";
import type { UpdateBusinessHoursCommand } from "../commands/UpdateBusinessHoursCommand.js";
import type { GetBusinessHoursQuery } from "../queries/GetBusinessHoursQuery.js";

type BusinessHoursPermission =
  | "restaurants.business-hours.read"
  | "restaurants.business-hours.update";

export class BusinessHoursApplicationService {
  constructor(
    private readonly repository: BusinessHoursRepository,
    private readonly factory: BusinessHoursFactory,
    private readonly authService: AuthorizationService,
    private readonly eventBus: EventBus,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: BusinessHoursPermission): Promise<void> {
    await this.authService.authorize(auth, permission);
  }

  async get(
    query: GetBusinessHoursQuery,
    auth: AuthorizationContext,
  ): Promise<BusinessHoursDTO> {
    await this.authorize(auth, "restaurants.business-hours.read");
    const businessHours = await this.repository.findByRestaurantId(query.restaurantId);
    if (!businessHours) {
      throw new BusinessHoursNotFoundError(query.restaurantId);
    }
    return BusinessHoursMapper.toDTO(businessHours);
  }

  async create(
    command: CreateBusinessHoursCommand,
    auth: AuthorizationContext,
  ): Promise<BusinessHoursDTO> {
    await this.authorize(auth, "restaurants.business-hours.update");

    const schedules = command.schedules.map((s) => {
      const dayOfWeek = DayOfWeek.create(s.dayOfWeek);
      const periods = s.periods.map((p) => {
        const openTime = OpeningTime.fromString(p.openTime);
        const closeTime = ClosingTime.fromString(p.closeTime);
        return OpeningPeriod.create(openTime, closeTime, p.order);
      });
      return DaySchedule.create(dayOfWeek, s.isClosed, periods);
    });

    const businessHours = this.factory.create({
      restaurantId: command.restaurantId,
      schedules,
    });

    const saved = await this.repository.save(businessHours);
    await this.eventBus.emit(
      "BusinessHoursCreated",
      new BusinessHoursCreated(saved.id, saved.restaurantId),
    );
    return BusinessHoursMapper.toDTO(saved);
  }

  async update(
    command: UpdateBusinessHoursCommand,
    auth: AuthorizationContext,
  ): Promise<BusinessHoursDTO> {
    await this.authorize(auth, "restaurants.business-hours.update");
    const existing = await this.repository.findByRestaurantId(command.restaurantId);
    if (!existing) {
      throw new BusinessHoursNotFoundError(command.restaurantId);
    }

    const schedules = command.schedules.map((s) => {
      const dayOfWeek = DayOfWeek.create(s.dayOfWeek);
      const periods = s.periods.map((p) => {
        const openTime = OpeningTime.fromString(p.openTime);
        const closeTime = ClosingTime.fromString(p.closeTime);
        return OpeningPeriod.create(openTime, closeTime, p.order);
      });
      return DaySchedule.create(dayOfWeek, s.isClosed, periods);
    });

    const updated: typeof existing = {
      ...existing,
      schedules,
    };

    const saved = await this.repository.update(updated);
    await this.eventBus.emit(
      "BusinessHoursUpdated",
      new BusinessHoursUpdated(saved.id, saved.restaurantId),
    );
    return BusinessHoursMapper.toDTO(saved);
  }

  async getOrCreate(
    query: GetBusinessHoursQuery,
    auth: AuthorizationContext,
  ): Promise<BusinessHoursDTO> {
    const existing = await this.repository.findByRestaurantId(query.restaurantId);
    if (existing) {
      await this.authorize(auth, "restaurants.business-hours.read");
      return BusinessHoursMapper.toDTO(existing);
    }
    const defaultSchedules = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i + 1,
      isClosed: i >= 5,
      periods: i < 5
        ? [{ openTime: "09:00", closeTime: "17:00", order: 0 }]
        : [],
    }));
    return this.create(
      { restaurantId: query.restaurantId, schedules: defaultSchedules },
      auth,
    );
  }
}
