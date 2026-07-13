import type { PrismaClient } from "@prisma/client";
import type { Reservation } from "../../domain/models/Reservation.js";
import type { ReservationRepository, ReservationListFilters } from "../../domain/repositories/ReservationRepository.js";
import type { ConcreteReservationFactory } from "./ConcreteReservationFactory.js";

interface PrismaReservationRecord {
  id: string;
  organizationId: string;
  branchId: string;
  customerId: string | null;
  confirmationCode: string;
  partySize: number;
  reservationDate: Date;
  startTime: Date;
  endTime: Date;
  status: string;
  specialRequests: string | null;
  notes: string | null;
  walkIn: boolean;
  source: string;
  tableGroupId: string | null;
  createdBy: string;
  assignedTo: string | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  noShowMarkedAt: Date | null;
  seatedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
  tableAssignments?: { tableId: string }[];
}

export class PrismaReservationRepository implements ReservationRepository {
  private readonly include = {
    tableAssignments: { select: { tableId: true } },
  };

  constructor(
    private readonly prisma: PrismaClient,
    private readonly factory: ConcreteReservationFactory,
  ) {}

  async save(reservation: Reservation): Promise<Reservation> {
    const created = await this.prisma.reservation.create({
      data: {
        id: reservation.id,
        organizationId: reservation.restaurantId,
        branchId: reservation.restaurantId,
        customerId: reservation.customerId,
        confirmationCode: reservation.reservationNumber.value,
        partySize: reservation.partySize.value,
        reservationDate: reservation.date.value,
        startTime: reservation.timeRange.startTime,
        endTime: reservation.timeRange.endTime,
        status: reservation.status.value,
        specialRequests: reservation.specialRequests,
        notes: reservation.notes,
        walkIn: reservation.source.value === "walk_in",
        source: reservation.source.value,
        tableGroupId: reservation.tableGroupId,
        createdBy: reservation.createdBy,
        tableAssignments: reservation.tableId
          ? { create: { tableId: reservation.tableId } }
          : undefined,
      },
      include: this.include,
    });

    return this.reconstitute(created);
  }

  async update(reservation: Reservation): Promise<Reservation> {
    await this.prisma.reservationTable.deleteMany({
      where: { reservationId: reservation.id },
    });

    const updated = await this.prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        customerId: reservation.customerId,
        confirmationCode: reservation.reservationNumber.value,
        partySize: reservation.partySize.value,
        reservationDate: reservation.date.value,
        startTime: reservation.timeRange.startTime,
        endTime: reservation.timeRange.endTime,
        status: reservation.status.value,
        specialRequests: reservation.specialRequests,
        notes: reservation.notes,
        walkIn: reservation.source.value === "walk_in",
        source: reservation.source.value,
        tableGroupId: reservation.tableGroupId,
        cancelledAt: reservation.cancelledAt,
        tableAssignments: reservation.tableId
          ? { create: { tableId: reservation.tableId } }
          : undefined,
      },
      include: this.include,
    });

    return this.reconstitute(updated);
  }

  async findById(id: string): Promise<Reservation | null> {
    const record = await this.prisma.reservation.findUnique({
      where: { id },
      include: this.include,
    });

    return record ? this.reconstitute(record) : null;
  }

  async findByIdAndRestaurant(id: string, restaurantId: string): Promise<Reservation | null> {
    const record = await this.prisma.reservation.findFirst({
      where: { id, organizationId: restaurantId },
      include: this.include,
    });

    return record ? this.reconstitute(record) : null;
  }

  async findByRestaurantId(restaurantId: string): Promise<Reservation[]> {
    const records = await this.prisma.reservation.findMany({
      where: { organizationId: restaurantId },
      include: this.include,
      orderBy: { createdAt: "desc" },
    });

    return records.map((r) => this.reconstitute(r));
  }

  async findByFilters(filters: ReservationListFilters): Promise<Reservation[]> {
    const where: Record<string, unknown> = { organizationId: filters.restaurantId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.date) {
      where.reservationDate = filters.date;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    const records = await this.prisma.reservation.findMany({
      where,
      include: this.include,
      orderBy: { createdAt: "desc" },
    });

    return records.map((r) => this.reconstitute(r));
  }

  private reconstitute(record: PrismaReservationRecord): Reservation {
    const tableId = record.tableAssignments && record.tableAssignments.length > 0
      ? record.tableAssignments[0].tableId
      : null;

    return this.factory.reconstitute({
      id: record.id,
      restaurantId: record.organizationId,
      reservationNumber: record.confirmationCode,
      customerId: record.customerId,
      tableId,
      tableGroupId: record.tableGroupId,
      date: record.reservationDate,
      startTime: record.startTime,
      endTime: record.endTime,
      partySize: record.partySize,
      status: record.status,
      source: record.source,
      notes: record.notes,
      specialRequests: record.specialRequests,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      cancelledAt: record.cancelledAt,
    });
  }
}
