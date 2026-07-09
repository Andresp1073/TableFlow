import { PrismaClient } from "@prisma/client";
import type { CalendarException } from "../../domain/models/CalendarException.js";
import type { CalendarExceptionRepository } from "../../domain/repositories/CalendarExceptionRepository.js";
import { ConcreteCalendarExceptionFactory } from "./ConcreteCalendarExceptionFactory.js";

export class PrismaCalendarExceptionRepository implements CalendarExceptionRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteCalendarExceptionFactory,
  ) {}

  async findByRestaurantId(restaurantId: string): Promise<CalendarException[]> {
    const records = await this.prisma.calendarException.findMany({
      where: { restaurantId },
      orderBy: [{ date: "asc" }, { priority: "desc" }],
    });
    return records.map((r) => this.reconstitute(r));
  }

  async findById(id: string): Promise<CalendarException | null> {
    const record = await this.prisma.calendarException.findUnique({
      where: { id },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async findByRestaurantIdAndDate(restaurantId: string, date: string): Promise<CalendarException[]> {
    const records = await this.prisma.calendarException.findMany({
      where: { restaurantId, date: new Date(date + "T00:00:00Z") },
      orderBy: [{ priority: "desc" }],
    });
    return records.map((r) => this.reconstitute(r));
  }

  async findByRestaurantIdAndDateRange(restaurantId: string, startDate: string, endDate: string): Promise<CalendarException[]> {
    const records = await this.prisma.calendarException.findMany({
      where: {
        restaurantId,
        date: {
          gte: new Date(startDate + "T00:00:00Z"),
          lte: new Date(endDate + "T00:00:00Z"),
        },
      },
      orderBy: [{ date: "asc" }, { priority: "desc" }],
    });
    return records.map((r) => this.reconstitute(r));
  }

  async findByDateAndType(restaurantId: string, date: string, type: string): Promise<CalendarException | null> {
    const record = await this.prisma.calendarException.findUnique({
      where: {
        restaurantId_date_type: {
          restaurantId,
          date: new Date(date + "T00:00:00Z"),
          type,
        },
      },
    });
    if (!record) return null;
    return this.reconstitute(record);
  }

  async save(calendarException: CalendarException): Promise<CalendarException> {
    const record = await this.prisma.calendarException.create({
      data: {
        id: calendarException.id,
        restaurantId: calendarException.restaurantId,
        title: calendarException.title,
        description: calendarException.description,
        type: calendarException.type.value,
        date: calendarException.date.toDate(),
        isClosed: calendarException.isClosed,
        openTime: calendarException.openTime,
        closeTime: calendarException.closeTime,
        allDay: calendarException.allDay,
        priority: calendarException.priority.value,
      },
    });
    return this.reconstitute(record);
  }

  async update(calendarException: CalendarException): Promise<CalendarException> {
    const record = await this.prisma.calendarException.update({
      where: { id: calendarException.id },
      data: {
        title: calendarException.title,
        description: calendarException.description,
        type: calendarException.type.value,
        date: calendarException.date.toDate(),
        isClosed: calendarException.isClosed,
        openTime: calendarException.openTime,
        closeTime: calendarException.closeTime,
        allDay: calendarException.allDay,
        priority: calendarException.priority.value,
      },
    });
    return this.reconstitute(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.calendarException.delete({
      where: { id },
    });
  }

  private reconstitute(record: {
    id: string;
    restaurantId: string;
    title: string;
    description: string | null;
    type: string;
    date: Date;
    isClosed: boolean;
    openTime: string | null;
    closeTime: string | null;
    allDay: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
  }): CalendarException {
    const dateStr = record.date.toISOString().slice(0, 10);
    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      title: record.title,
      description: record.description,
      type: record.type,
      date: dateStr,
      isClosed: record.isClosed,
      openTime: record.openTime,
      closeTime: record.closeTime,
      allDay: record.allDay,
      priority: record.priority,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
