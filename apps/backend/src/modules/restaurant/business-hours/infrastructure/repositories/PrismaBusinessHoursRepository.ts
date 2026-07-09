import { PrismaClient } from "@prisma/client";
import type { BusinessHours } from "../../domain/models/BusinessHours.js";
import type { BusinessHoursRepository } from "../../domain/repositories/BusinessHoursRepository.js";
import { ConcreteBusinessHoursFactory } from "./ConcreteBusinessHoursFactory.js";

export class PrismaBusinessHoursRepository implements BusinessHoursRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteBusinessHoursFactory,
  ) {}

  async findByRestaurantId(restaurantId: string): Promise<BusinessHours | null> {
    const record = await this.prisma.businessHours.findUnique({
      where: { restaurantId },
      include: { periods: { orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }] } },
    });

    if (!record) return null;

    const dayMap = new Map<number, { isClosed: boolean; periods: Array<{ openTime: number; closeTime: number; order: number }> }>();

    for (let d = 1; d <= 7; d++) {
      dayMap.set(d, { isClosed: false, periods: [] });
    }

    for (const period of record.periods) {
      const day = dayMap.get(period.dayOfWeek);
      if (day) {
        day.isClosed = false;
        day.periods.push({
          openTime: period.openTime,
          closeTime: period.closeTime,
          order: period.order,
        });
      }
    }

    const allDayIds = new Set(record.periods.map((p) => p.dayOfWeek));
    for (let d = 1; d <= 7; d++) {
      if (!allDayIds.has(d)) {
        dayMap.set(d, { isClosed: true, periods: [] });
      }
    }

    const schedules = Array.from(dayMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([dayOfWeek, dayData]) => ({
        dayOfWeek,
        isClosed: dayData.isClosed,
        periods: dayData.periods.sort((a, b) => a.order - b.order),
      }));

    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      schedules,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async save(businessHours: BusinessHours): Promise<BusinessHours> {
    const periodData = businessHours.schedules.flatMap((schedule) =>
      schedule.periods.map((period) => ({
        dayOfWeek: schedule.dayOfWeek.value,
        openTime: period.openTime.value,
        closeTime: period.closeTime.value,
        order: period.order,
      })),
    );

    const record = await this.prisma.businessHours.create({
      data: {
        id: businessHours.id,
        restaurantId: businessHours.restaurantId,
        periods: {
          create: periodData,
        },
      },
      include: { periods: { orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }] } },
    });

    return this.reconstituteFromRecord(record);
  }

  async update(businessHours: BusinessHours): Promise<BusinessHours> {
    const periodData = businessHours.schedules.flatMap((schedule) =>
      schedule.periods.map((period) => ({
        dayOfWeek: schedule.dayOfWeek.value,
        openTime: period.openTime.value,
        closeTime: period.closeTime.value,
        order: period.order,
      })),
    );

    const record = await this.prisma.$transaction(async (tx) => {
      await tx.openingPeriod.deleteMany({
        where: { businessHoursId: businessHours.id },
      });

      return tx.businessHours.update({
        where: { id: businessHours.id },
        data: {
          periods: {
            create: periodData,
          },
        },
        include: { periods: { orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }] } },
      });
    });

    return this.reconstituteFromRecord(record);
  }

  private reconstituteFromRecord(record: {
    id: string;
    restaurantId: string;
    createdAt: Date;
    updatedAt: Date;
    periods: Array<{
      dayOfWeek: number;
      openTime: number;
      closeTime: number;
      order: number;
    }>;
  }): BusinessHours {
    const dayMap = new Map<number, { isClosed: boolean; periods: Array<{ openTime: number; closeTime: number; order: number }> }>();

    for (let d = 1; d <= 7; d++) {
      dayMap.set(d, { isClosed: false, periods: [] });
    }

    const allDayIds = new Set<number>();
    for (const period of record.periods) {
      allDayIds.add(period.dayOfWeek);
      dayMap.set(period.dayOfWeek, {
        isClosed: false,
        periods: [
          ...(dayMap.get(period.dayOfWeek)?.periods ?? []),
          { openTime: period.openTime, closeTime: period.closeTime, order: period.order },
        ],
      });
    }

    for (let d = 1; d <= 7; d++) {
      if (!allDayIds.has(d)) {
        dayMap.set(d, { isClosed: true, periods: [] });
      }
    }

    const schedules = Array.from(dayMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([dayOfWeek, dayData]) => ({
        dayOfWeek,
        isClosed: dayData.isClosed,
        periods: dayData.periods.sort((a, b) => a.order - b.order),
      }));

    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.restaurantId,
      schedules,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
