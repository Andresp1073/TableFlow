import type { AvailabilityService } from "../../application/ports/AvailabilityService.js";
import type { TableRepository } from "../../../tables/domain/repositories/TableRepository.js";
import type { TableGroupRepository } from "../../../table-groups/domain/repositories/TableGroupRepository.js";
import type { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import type { AssignmentCandidate, AssignmentContext } from "./types.js";
import { ReservationTimeRange } from "../../domain/models/ReservationTimeRange.js";

export class AssignmentCandidateGenerator {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly tableRepository: TableRepository,
    private readonly tableGroupRepository: TableGroupRepository,
    private readonly reservationRepository: ReservationRepository,
  ) {}

  async generate(context: AssignmentContext): Promise<AssignmentCandidate[]> {
    const tables = await this.tableRepository.findByFilters({
      restaurantId: context.restaurantId,
      isActive: true,
      isReservable: true,
    });

    const tableMap = new Map(tables.map((t) => [t.id, t]));

    const individualCandidates = await this.generateIndividualCandidates(tables, context);

    const groupCandidates = await this.generateGroupCandidates(tableMap, context);

    return [...individualCandidates, ...groupCandidates];
  }

  private async generateIndividualCandidates(
    tables: import("../../../tables/domain/models/Table.js").Table[],
    context: AssignmentContext,
  ): Promise<AssignmentCandidate[]> {
    const candidates: AssignmentCandidate[] = [];

    for (const table of tables) {
      const minCap = table.minimumCapacity.value;
      const maxCap = table.maximumCapacity.value;

      if (context.partySize < minCap || context.partySize > maxCap) {
        continue;
      }

      if (context.isAccessibleRequired && !table.isAccessible) {
        continue;
      }

      if (context.preferredDiningAreaId && table.diningAreaId !== context.preferredDiningAreaId) {
        continue;
      }

      if (context.preferredTableTypeId && table.tableTypeId !== context.preferredTableTypeId) {
        continue;
      }

      const isOverlapping = await this.hasOverlappingReservation(
        table.id,
        context.date,
        context.startTime,
        context.endTime,
        context.excludeReservationId,
      );

      let isAvailable = false;
      let availabilityReason: string | null = null;

      if (!isOverlapping) {
        const availabilityResult = await this.availabilityService.checkAvailability({
          restaurantId: context.restaurantId,
          date: context.date.toISOString(),
          startTime: context.startTime.toISOString(),
          endTime: context.endTime.toISOString(),
          partySize: context.partySize,
          tableId: table.id,
          diningAreaId: table.diningAreaId,
          tableTypeId: table.tableTypeId,
        });
        isAvailable = availabilityResult.available;
        availabilityReason = availabilityResult.reason;
      } else {
        availabilityReason = "Table has overlapping reservation";
      }

      candidates.push({
        tableId: table.id,
        partySize: context.partySize,
        isTableGroup: false,
        tableGroupId: null,
        diningAreaId: table.diningAreaId,
        tableTypeId: table.tableTypeId,
        minimumCapacity: minCap,
        maximumCapacity: maxCap,
        isAccessible: table.isAccessible,
        isAvailable,
        availabilityReason,
      });
    }

    return candidates;
  }

  private async generateGroupCandidates(
    tableMap: Map<string, import("../../../tables/domain/models/Table.js").Table>,
    context: AssignmentContext,
  ): Promise<AssignmentCandidate[]> {
    const candidates: AssignmentCandidate[] = [];
    const groups = await this.tableGroupRepository.findByFilters({
      restaurantId: context.restaurantId,
    });

    for (const group of groups) {
      if (!group.isActive) continue;

      const members = group.members;
      if (members.length === 0) continue;

      let maxCapacity = 0;
      let minCapacity = 0;
      let areAllAccessible = true;
      let groupDiningAreaId: string | null = null;
      let groupTableTypeId: string | null = null;

      for (const member of members) {
        const table = tableMap.get(member.tableId);
        if (!table) {
          areAllAccessible = false;
          continue;
        }
        maxCapacity += table.maximumCapacity.value;
        minCapacity += table.minimumCapacity.value;
        if (!table.isAccessible) {
          areAllAccessible = false;
        }
        if (table.diningAreaId) {
          groupDiningAreaId = table.diningAreaId;
        }
        if (table.tableTypeId) {
          groupTableTypeId = table.tableTypeId;
        }
      }

      if (context.partySize < minCapacity || context.partySize > maxCapacity) {
        continue;
      }

      if (context.isAccessibleRequired && !areAllAccessible) {
        continue;
      }

      let allAvailable = true;
      let groupReason: string | null = null;

      for (const member of members) {
        const isOverlapping = await this.hasOverlappingReservation(
          member.tableId,
          context.date,
          context.startTime,
          context.endTime,
          context.excludeReservationId,
        );

        if (isOverlapping) {
          allAvailable = false;
          groupReason = `Table ${member.tableId} in group has overlapping reservation`;
          break;
        }

        const availabilityResult = await this.availabilityService.checkAvailability({
          restaurantId: context.restaurantId,
          date: context.date.toISOString(),
          startTime: context.startTime.toISOString(),
          endTime: context.endTime.toISOString(),
          partySize: context.partySize,
          tableId: member.tableId,
        });

        if (!availabilityResult.available) {
          allAvailable = false;
          groupReason = `Table ${member.tableId} in group not available: ${availabilityResult.reason}`;
          break;
        }
      }

      candidates.push({
        tableId: members[0]?.tableId ?? "",
        partySize: context.partySize,
        isTableGroup: true,
        tableGroupId: group.id.value,
        diningAreaId: groupDiningAreaId,
        tableTypeId: groupTableTypeId,
        minimumCapacity: minCapacity,
        maximumCapacity: maxCapacity,
        isAccessible: areAllAccessible,
        isAvailable: allAvailable,
        availabilityReason: groupReason,
      });
    }

    return candidates;
  }

  private async hasOverlappingReservation(
    tableId: string,
    date: Date,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: string | null,
  ): Promise<boolean> {
    const existingReservations = await this.reservationRepository.findByFilters({
      restaurantId: "",
      date,
    });

    const filtered = excludeReservationId
      ? existingReservations.filter((r) => r.id !== excludeReservationId)
      : existingReservations;

    const active = filtered.filter((r) => r.status.isActive());

    const timeRange = ReservationTimeRange.create(startTime, endTime);

    for (const reservation of active) {
      if (reservation.tableId === tableId && reservation.timeRange.overlapsWith(timeRange)) {
        return true;
      }
    }

    return false;
  }
}
