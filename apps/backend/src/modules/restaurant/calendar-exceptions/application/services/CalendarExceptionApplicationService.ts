import type { CalendarExceptionRepository, CalendarExceptionFactory } from "../../domain/repositories/index.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import { EventBus } from "../../../../events/EventBus.js";
import { ExceptionDate } from "../../domain/models/ExceptionDate.js";
import { ExceptionType } from "../../domain/models/ExceptionType.js";
import { Priority } from "../../domain/models/Priority.js";
import { CalendarExceptionNotFoundError } from "../../errors/CalendarExceptionNotFoundError.js";
import { CalendarExceptionDuplicateError } from "../../errors/CalendarExceptionDuplicateError.js";
import { CalendarExceptionCreated } from "../../domain/events/CalendarExceptionCreated.js";
import { CalendarExceptionUpdated } from "../../domain/events/CalendarExceptionUpdated.js";
import { CalendarExceptionDeleted } from "../../domain/events/CalendarExceptionDeleted.js";
import { CalendarExceptionMapper } from "../mappers/CalendarExceptionMapper.js";
import { CalendarExceptionRules } from "../../domain/rules/CalendarExceptionRules.js";
import type { CalendarExceptionDTO } from "../dtos/CalendarExceptionDTO.js";
import type { CreateCalendarExceptionCommand } from "../commands/CreateCalendarExceptionCommand.js";
import type { UpdateCalendarExceptionCommand } from "../commands/UpdateCalendarExceptionCommand.js";
import type { DeleteCalendarExceptionCommand } from "../commands/DeleteCalendarExceptionCommand.js";
import type { GetCalendarExceptionsQuery } from "../queries/GetCalendarExceptionsQuery.js";

type CalendarExceptionPermission =
  | "restaurants.calendar-exceptions.read"
  | "restaurants.calendar-exceptions.create"
  | "restaurants.calendar-exceptions.update"
  | "restaurants.calendar-exceptions.delete";

export class CalendarExceptionApplicationService {
  constructor(
    private readonly repository: CalendarExceptionRepository,
    private readonly factory: CalendarExceptionFactory,
    private readonly authService: AuthorizationService,
    private readonly eventBus: EventBus,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: CalendarExceptionPermission): Promise<void> {
    await this.authService.authorize(auth, permission);
  }

  async getAll(
    query: GetCalendarExceptionsQuery,
    auth: AuthorizationContext,
  ): Promise<CalendarExceptionDTO[]> {
    await this.authorize(auth, "restaurants.calendar-exceptions.read");

    let exceptions: import("../../domain/models/CalendarException.js").CalendarException[];
    if (query.startDate && query.endDate) {
      exceptions = await this.repository.findByRestaurantIdAndDateRange(
        query.restaurantId,
        query.startDate,
        query.endDate,
      );
    } else {
      exceptions = await this.repository.findByRestaurantId(query.restaurantId);
    }

    return CalendarExceptionMapper.toDTOList(exceptions);
  }

  async create(
    command: CreateCalendarExceptionCommand,
    auth: AuthorizationContext,
  ): Promise<CalendarExceptionDTO> {
    await this.authorize(auth, "restaurants.calendar-exceptions.create");

    const type = ExceptionType.create(command.type);
    const date = ExceptionDate.create(command.date);
    const priority = command.priority !== undefined
      ? Priority.create(command.priority)
      : Priority.create(Priority.DEFAULT);

    const existing = await this.repository.findByDateAndType(
      command.restaurantId,
      command.date,
      command.type,
    );
    CalendarExceptionRules.validateExceptionNotDuplicate(existing?.id ?? null, command.date, command.type);

    if (!command.isClosed) {
      CalendarExceptionRules.validateTimesForNonClosed(
        command.isClosed,
        type,
        command.openTime ?? null,
        command.closeTime ?? null,
      );
    }

    CalendarExceptionRules.validateClosedExceptionNoHours(
      command.isClosed,
      type,
      command.openTime ?? null,
      command.closeTime ?? null,
    );

    const calendarException = this.factory.create({
      restaurantId: command.restaurantId,
      title: command.title,
      description: command.description ?? null,
      type,
      date,
      isClosed: command.isClosed,
      openTime: command.openTime ?? null,
      closeTime: command.closeTime ?? null,
      allDay: command.allDay,
      priority,
    });

    const saved = await this.repository.save(calendarException);
    await this.eventBus.emit(
      "CalendarExceptionCreated",
      new CalendarExceptionCreated(saved.id, saved.restaurantId, saved.type.value, saved.date.value),
    );

    return CalendarExceptionMapper.toDTO(saved);
  }

  async update(
    command: UpdateCalendarExceptionCommand,
    auth: AuthorizationContext,
  ): Promise<CalendarExceptionDTO> {
    await this.authorize(auth, "restaurants.calendar-exceptions.update");

    const existing = await this.repository.findById(command.id);
    if (!existing) {
      throw new CalendarExceptionNotFoundError(command.id);
    }

    const type = ExceptionType.create(command.type);
    const date = ExceptionDate.create(command.date);
    const priority = command.priority !== undefined
      ? Priority.create(command.priority)
      : existing.priority;

    if (existing.date.value !== command.date || existing.type.value !== command.type) {
      const duplicate = await this.repository.findByDateAndType(
        command.restaurantId,
        command.date,
        command.type,
      );
      if (duplicate && duplicate.id !== command.id) {
        throw new CalendarExceptionDuplicateError(command.date, command.type);
      }
    }

    if (!command.isClosed) {
      CalendarExceptionRules.validateTimesForNonClosed(
        command.isClosed,
        type,
        command.openTime ?? null,
        command.closeTime ?? null,
      );
    }

    CalendarExceptionRules.validateClosedExceptionNoHours(
      command.isClosed,
      type,
      command.openTime ?? null,
      command.closeTime ?? null,
    );

    const updated: typeof existing = {
      ...existing,
      title: command.title,
      description: command.description ?? null,
      type,
      date,
      isClosed: command.isClosed,
      openTime: command.openTime ?? null,
      closeTime: command.closeTime ?? null,
      allDay: command.allDay,
      priority,
    };

    const saved = await this.repository.update(updated);
    await this.eventBus.emit(
      "CalendarExceptionUpdated",
      new CalendarExceptionUpdated(saved.id, saved.restaurantId, saved.type.value, saved.date.value),
    );

    return CalendarExceptionMapper.toDTO(saved);
  }

  async delete(
    command: DeleteCalendarExceptionCommand,
    auth: AuthorizationContext,
  ): Promise<void> {
    await this.authorize(auth, "restaurants.calendar-exceptions.delete");

    const existing = await this.repository.findById(command.id);
    if (!existing) {
      throw new CalendarExceptionNotFoundError(command.id);
    }

    await this.repository.delete(command.id);
    await this.eventBus.emit(
      "CalendarExceptionDeleted",
      new CalendarExceptionDeleted(command.id, command.restaurantId),
    );
  }
}
