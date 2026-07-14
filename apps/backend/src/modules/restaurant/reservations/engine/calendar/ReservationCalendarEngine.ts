import type { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import type { TableRepository } from "../../../tables/domain/repositories/TableRepository.js";
import { ReservationConflictPipeline } from "../conflict-pipeline/ReservationConflictPipeline.js";
import { CalendarOccupancyCalculator } from "./CalendarOccupancyCalculator.js";
import { CalendarAvailabilityCalculator } from "./CalendarAvailabilityCalculator.js";
import { CalendarConflictAggregator } from "./CalendarConflictAggregator.js";
import { CalendarDayBuilder } from "./CalendarDayBuilder.js";
import { CalendarWeekBuilder } from "./CalendarWeekBuilder.js";
import { CalendarTimelineBuilder } from "./CalendarTimelineBuilder.js";
import type { CalendarDayView, CalendarWeekView, CalendarTimelineView, OccupancyView, CalendarAvailabilityView, CalendarConflictView, CalendarQuery, CalendarWeekQuery } from "./types.js";

export interface ReservationCalendarEngineDependencies {
  reservationRepository: ReservationRepository;
  tableRepository: TableRepository;
  conflictPipeline: ReservationConflictPipeline;
}

export class ReservationCalendarEngine {
  private readonly dayBuilder: CalendarDayBuilder;
  private readonly weekBuilder: CalendarWeekBuilder;
  private readonly timelineBuilder: CalendarTimelineBuilder;
  private readonly occupancyCalculator: CalendarOccupancyCalculator;
  private readonly availabilityCalculator: CalendarAvailabilityCalculator;
  private readonly conflictAggregator: CalendarConflictAggregator;

  constructor(private readonly deps: ReservationCalendarEngineDependencies) {
    this.occupancyCalculator = new CalendarOccupancyCalculator();
    this.availabilityCalculator = new CalendarAvailabilityCalculator();
    this.conflictAggregator = new CalendarConflictAggregator(deps.conflictPipeline);
    this.dayBuilder = new CalendarDayBuilder(
      this.occupancyCalculator,
      this.availabilityCalculator,
      this.conflictAggregator,
    );
    this.weekBuilder = new CalendarWeekBuilder(this.dayBuilder);
    this.timelineBuilder = new CalendarTimelineBuilder();
  }

  async getDayView(query: CalendarQuery): Promise<CalendarDayView> {
    const reservations = await this.deps.reservationRepository.findByFilters({
      restaurantId: query.restaurantId,
      date: query.date,
    });

    const tables = await this.deps.tableRepository.findByFilters({
      restaurantId: query.restaurantId,
      isActive: true,
      isReservable: true,
    });

    return this.dayBuilder.build(query.date, query.restaurantId, reservations, tables);
  }

  async getWeekView(query: CalendarWeekQuery): Promise<CalendarWeekView> {
    const reservationsByDate = new Map<string, import("../../domain/models/Reservation.js").Reservation[]>();
    const tablesByDate = new Map<string, import("../../../tables/domain/models/Table.js").Table[]>();

    const tables = await this.deps.tableRepository.findByFilters({
      restaurantId: query.restaurantId,
      isActive: true,
      isReservable: true,
    });

    for (let i = 0; i < 7; i++) {
      const date = new Date(query.startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0] ?? "";

      const reservations = await this.deps.reservationRepository.findByFilters({
        restaurantId: query.restaurantId,
        date,
      });

      reservationsByDate.set(dateKey, reservations);
      tablesByDate.set(dateKey, tables);
    }

    return this.weekBuilder.build(query.startDate, query.restaurantId, reservationsByDate, tablesByDate);
  }

  async getTimelineView(query: CalendarQuery): Promise<CalendarTimelineView> {
    const reservations = await this.deps.reservationRepository.findByFilters({
      restaurantId: query.restaurantId,
      date: query.date,
    });

    const tables = await this.deps.tableRepository.findByFilters({
      restaurantId: query.restaurantId,
      isActive: true,
      isReservable: true,
    });

    return this.timelineBuilder.build(query.date, query.restaurantId, reservations, tables);
  }

  async getOccupancyView(query: CalendarQuery): Promise<OccupancyView> {
    const reservations = await this.deps.reservationRepository.findByFilters({
      restaurantId: query.restaurantId,
      date: query.date,
    });

    const tables = await this.deps.tableRepository.findByFilters({
      restaurantId: query.restaurantId,
      isActive: true,
      isReservable: true,
    });

    const summaries = reservations.map((r) => ({
      id: r.id,
      reservationNumber: r.reservationNumber.value,
      customerId: r.customerId,
      tableId: r.tableId,
      tableGroupId: r.tableGroupId,
      startTime: r.timeRange.startTime,
      endTime: r.timeRange.endTime,
      partySize: r.partySize.value,
      status: r.status.value,
      source: r.source.value,
      notes: r.notes,
    }));

    return this.occupancyCalculator.calculate(
      query.date,
      query.restaurantId,
      tables,
      summaries,
      reservations,
    );
  }

  async getAvailabilityView(query: CalendarQuery): Promise<CalendarAvailabilityView> {
    const reservations = await this.deps.reservationRepository.findByFilters({
      restaurantId: query.restaurantId,
      date: query.date,
    });

    const tables = await this.deps.tableRepository.findByFilters({
      restaurantId: query.restaurantId,
      isActive: true,
      isReservable: true,
    });

    const activeReservations = reservations.filter((r) => r.status.isActive());

    return this.availabilityCalculator.calculate(
      query.date,
      query.restaurantId,
      tables,
      activeReservations,
    );
  }

  async getConflictView(query: CalendarQuery): Promise<CalendarConflictView> {
    const reservations = await this.deps.reservationRepository.findByFilters({
      restaurantId: query.restaurantId,
      date: query.date,
    });

    const activeReservations = reservations.filter((r) => r.status.isActive());

    return this.conflictAggregator.aggregate(
      query.date,
      query.restaurantId,
      activeReservations,
    );
  }

  getDayBuilder(): CalendarDayBuilder {
    return this.dayBuilder;
  }

  getWeekBuilder(): CalendarWeekBuilder {
    return this.weekBuilder;
  }

  getTimelineBuilder(): CalendarTimelineBuilder {
    return this.timelineBuilder;
  }
}
