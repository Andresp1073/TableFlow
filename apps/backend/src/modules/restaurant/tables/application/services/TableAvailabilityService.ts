import { AvailabilityEngine } from "../../domain/services/availability/AvailabilityEngine.js";
import type { AvailabilityEvaluator } from "../../domain/services/availability/AvailabilityEvaluator.js";
import type { AvailabilityContext } from "../../domain/services/availability/AvailabilityContext.js";
import { available, unavailable } from "../../domain/services/availability/AvailabilityResult.js";
import { RestaurantStatusEvaluator } from "../../domain/services/availability/evaluators/RestaurantStatusEvaluator.js";
import { BusinessHoursEvaluator } from "../../domain/services/availability/evaluators/BusinessHoursEvaluator.js";
import type { BusinessHoursRepository } from "../../domain/services/availability/evaluators/BusinessHoursEvaluator.js";
import { CalendarExceptionEvaluator } from "../../domain/services/availability/evaluators/CalendarExceptionEvaluator.js";
import type { CalendarExceptionRepository } from "../../domain/services/availability/evaluators/CalendarExceptionEvaluator.js";
import { TableStatusEvaluator } from "../../domain/services/availability/evaluators/TableStatusEvaluator.js";
import { TableActiveEvaluator } from "../../domain/services/availability/evaluators/TableActiveEvaluator.js";
import { DiningAreaEvaluator } from "../../domain/services/availability/evaluators/DiningAreaEvaluator.js";
import type { DiningAreaRepository } from "../../domain/services/availability/evaluators/DiningAreaEvaluator.js";
import { TableTypeEvaluator } from "../../domain/services/availability/evaluators/TableTypeEvaluator.js";
import type { TableTypeRepository } from "../../domain/services/availability/evaluators/TableTypeEvaluator.js";
import { ReservationPolicyEvaluator } from "../../domain/services/availability/evaluators/ReservationPolicyEvaluator.js";
import type { ReservationPolicyRepository } from "../../domain/services/availability/evaluators/ReservationPolicyEvaluator.js";
import { FutureReservationEvaluator } from "../../domain/services/availability/evaluators/FutureReservationEvaluator.js";
import { TableGroupEvaluator } from "../../domain/services/availability/evaluators/TableGroupEvaluator.js";
import type { TableGroupRepositoryForEval } from "../../domain/services/availability/evaluators/TableGroupEvaluator.js";
import type { TableRepository } from "../../domain/repositories/TableRepository.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import type { CheckTableAvailabilityQuery } from "../queries/CheckTableAvailabilityQuery.js";
import type { ListAvailableTablesQuery } from "../queries/ListAvailableTablesQuery.js";
import type { TableAvailabilityDTO, AvailabilityCheckDTO, ListAvailableTablesResultDTO } from "../dto/TableAvailabilityDTO.js";
import { TableAvailabilityCacheService } from "./TableAvailabilityCacheService.js";

export class TableAvailabilityService {
  private readonly engine: AvailabilityEngine;

  constructor(
    private readonly tableRepository: TableRepository,
    private readonly businessHoursRepo: BusinessHoursRepository,
    private readonly calendarExceptionRepo: CalendarExceptionRepository,
    private readonly diningAreaRepo: DiningAreaRepository,
    private readonly tableTypeRepo: TableTypeRepository,
    private readonly reservationPolicyRepo: ReservationPolicyRepository,
    private readonly authService: AuthorizationService,
    private readonly cacheService: TableAvailabilityCacheService,
    private readonly tableGroupRepo: TableGroupRepositoryForEval,
  ) {
    this.engine = this.createEngine();
  }

  private createEngine(): AvailabilityEngine {
    const evaluators: AvailabilityEvaluator[] = [
      new RestaurantStatusEvaluator(),
      new BusinessHoursEvaluator(this.businessHoursRepo),
      new CalendarExceptionEvaluator(this.calendarExceptionRepo),
      new TableGroupEvaluator(this.tableGroupRepo),
      new TableActiveEvaluator(this.tableRepository as any),
      new DiningAreaEvaluator(this.diningAreaRepo),
      new TableTypeEvaluator(this.tableTypeRepo),
      new TableStatusEvaluator(this.tableRepository as any),
      new ReservationPolicyEvaluator(this.reservationPolicyRepo),
      new FutureReservationEvaluator(),
    ];
    return new AvailabilityEngine(evaluators);
  }

  async checkTableAvailability(
    query: CheckTableAvailabilityQuery,
    auth: AuthorizationContext,
  ): Promise<AvailabilityCheckDTO> {
    await this.authService.authorize(auth, "tables.read");

    const context: AvailabilityContext = {
      restaurantId: query.restaurantId,
      date: query.date,
      time: query.time,
      partySize: query.partySize,
      duration: query.duration,
    };

    (context as any).tableId = query.tableId;

    const result = await this.engine.evaluate(context);

    return {
      available: result.available,
      reason: result.reason,
    };
  }

  async checkTableAvailabilityDetailed(
    query: CheckTableAvailabilityQuery,
    auth: AuthorizationContext,
  ): Promise<AvailabilityCheckDTO & { details: any[] }> {
    await this.authService.authorize(auth, "tables.read");

    const context: AvailabilityContext = {
      restaurantId: query.restaurantId,
      date: query.date,
      time: query.time,
      partySize: query.partySize,
      duration: query.duration,
    };

    (context as any).tableId = query.tableId;

    const results = await this.engine.evaluateAll(context);
    const finalResult = results.find((r) => !r.available) ?? results[results.length - 1];

    return {
      available: finalResult.available,
      reason: finalResult.reason,
      details: results.map((r) => ({
        evaluator: (r.metadata?.evaluator as string) ?? "unknown",
        available: r.available,
        reason: r.reason,
      })),
    };
  }

  async listAvailableTables(
    query: ListAvailableTablesQuery,
    auth: AuthorizationContext,
  ): Promise<ListAvailableTablesResultDTO> {
    await this.authService.authorize(auth, "tables.read");

    const tables = await this.tableRepository.findByFilters({
      restaurantId: query.restaurantId,
      diningAreaId: query.diningAreaId,
      tableTypeId: query.tableTypeId,
      status: "available",
      isReservable: true,
      isActive: true,
      minCapacity: query.minCapacity,
    });

    const filteredTables = tables.filter((table) => {
      if (query.maxCapacity !== undefined && table.maximumCapacity.value > query.maxCapacity) {
        return false;
      }
      if (query.isAccessible !== undefined && table.isAccessible !== query.isAccessible) {
        return false;
      }
      return true;
    });

    const availabilityResults: TableAvailabilityDTO[] = [];

    for (const table of filteredTables) {
      const context: AvailabilityContext = {
        restaurantId: query.restaurantId,
        date: query.date,
        time: query.time,
        partySize: query.partySize,
        duration: query.duration,
        diningAreaId: table.diningAreaId ?? undefined,
        tableTypeId: table.tableTypeId ?? undefined,
      };

      (context as any).tableId = table.id;

      const result = await this.engine.evaluate(context);

      availabilityResults.push({
        tableId: table.id,
        available: result.available,
        reason: result.reason,
        metadata: result.metadata,
      });
    }

    return {
      availableTables: availabilityResults,
      totalTables: filteredTables.length,
      availableCount: availabilityResults.filter((r) => r.available).length,
    };
  }

  getEngine(): AvailabilityEngine {
    return this.engine;
  }
}
