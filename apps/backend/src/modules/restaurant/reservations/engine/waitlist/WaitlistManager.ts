import type { WaitlistRepository } from "./WaitlistRepository.js";
import type { WaitlistEntry } from "./WaitlistEntry.js";
import { WaitlistStatus } from "./WaitlistStatus.js";
import { WaitlistEligibilityPolicy } from "./WaitlistEligibilityPolicy.js";
import { WaitlistPriorityCalculator } from "./WaitlistPriorityCalculator.js";

export interface CreateWaitlistInput {
  restaurantId: string;
  reservationId?: string | null;
  customerId?: string | null;
  partySize: number;
  source: import("../../domain/models/ReservationSource.js").ReservationSource;
  requestedDate: Date;
  requestedStartTime: Date;
  requestedEndTime: Date;
  notes?: string | null;
}

export interface UpdateWaitlistInput {
  id: string;
  restaurantId: string;
  partySize?: number;
  requestedStartTime?: Date;
  requestedEndTime?: Date;
  notes?: string | null;
}

export class WaitlistManager {
  constructor(
    private readonly repository: WaitlistRepository,
    private readonly eligibilityPolicy: WaitlistEligibilityPolicy = new WaitlistEligibilityPolicy(),
    private readonly priorityCalculator: WaitlistPriorityCalculator = new WaitlistPriorityCalculator(),
  ) {}

  async addToWaitlist(input: CreateWaitlistInput): Promise<WaitlistEntry> {
    const eligibility = this.eligibilityPolicy.canAddToWaitlist(
      input.partySize,
      input.requestedStartTime,
      input.requestedEndTime,
    );

    if (!eligibility.eligible) {
      throw new Error(`Cannot add to waitlist: ${eligibility.reason}`);
    }

    const now = new Date();
    const source = input.source;

    const entry: WaitlistEntry = {
      id: this.generateId(),
      restaurantId: input.restaurantId,
      reservationId: input.reservationId ?? null,
      customerId: input.customerId ?? null,
      partySize: input.partySize,
      source,
      requestedDate: input.requestedDate,
      requestedStartTime: input.requestedStartTime,
      requestedEndTime: input.requestedEndTime,
      status: WaitlistStatus.create("waiting"),
      priority: 0,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
      expiredAt: null,
      promotedAt: null,
    };

    const priority = this.priorityCalculator.calculate(entry);
    const scored: WaitlistEntry = { ...entry, priority: priority.score };

    return this.repository.save(scored);
  }

  async updateWaitlist(input: UpdateWaitlistInput): Promise<WaitlistEntry> {
    const existing = await this.repository.findByIdAndRestaurant(input.id, input.restaurantId);
    if (!existing) {
      throw new Error(`Waitlist entry ${input.id} not found`);
    }

    if (existing.status.isTerminal()) {
      throw new Error(`Cannot update a ${existing.status.value} waitlist entry`);
    }

    const updated: WaitlistEntry = {
      ...existing,
      partySize: input.partySize ?? existing.partySize,
      requestedStartTime: input.requestedStartTime ?? existing.requestedStartTime,
      requestedEndTime: input.requestedEndTime ?? existing.requestedEndTime,
      notes: input.notes !== undefined ? input.notes : existing.notes,
      updatedAt: new Date(),
    };

    const priority = this.priorityCalculator.calculate(updated);
    const scored: WaitlistEntry = { ...updated, priority: priority.score };

    return this.repository.update(scored);
  }

  async removeFromWaitlist(id: string, restaurantId: string): Promise<void> {
    const existing = await this.repository.findByIdAndRestaurant(id, restaurantId);
    if (!existing) {
      throw new Error(`Waitlist entry ${id} not found`);
    }

    await this.repository.remove(id);
  }

  async cancelWaitlist(id: string, restaurantId: string): Promise<WaitlistEntry> {
    const existing = await this.repository.findByIdAndRestaurant(id, restaurantId);
    if (!existing) {
      throw new Error(`Waitlist entry ${id} not found`);
    }

    if (existing.status.isTerminal()) {
      throw new Error(`Cannot cancel a ${existing.status.value} waitlist entry`);
    }

    const updated: WaitlistEntry = {
      ...existing,
      status: WaitlistStatus.create("cancelled"),
      updatedAt: new Date(),
    };

    return this.repository.update(updated);
  }

  async expireWaitlist(id: string, restaurantId: string): Promise<WaitlistEntry> {
    const existing = await this.repository.findByIdAndRestaurant(id, restaurantId);
    if (!existing) {
      throw new Error(`Waitlist entry ${id} not found`);
    }

    if (existing.status.isTerminal()) {
      throw new Error(`Cannot expire a ${existing.status.value} waitlist entry`);
    }

    const updated: WaitlistEntry = {
      ...existing,
      status: WaitlistStatus.create("expired"),
      expiredAt: new Date(),
      updatedAt: new Date(),
    };

    return this.repository.update(updated);
  }

  async markEligible(id: string, restaurantId: string): Promise<WaitlistEntry> {
    const existing = await this.repository.findByIdAndRestaurant(id, restaurantId);
    if (!existing) {
      throw new Error(`Waitlist entry ${id} not found`);
    }

    if (!existing.status.isTransitionValid("eligible")) {
      throw new Error(`Cannot mark ${existing.status.value} entry as eligible`);
    }

    const updated: WaitlistEntry = {
      ...existing,
      status: WaitlistStatus.create("eligible"),
      updatedAt: new Date(),
    };

    return this.repository.update(updated);
  }

  async getWaitlist(restaurantId: string): Promise<WaitlistEntry[]> {
    return this.repository.findByRestaurantId(restaurantId);
  }

  async getActiveWaitlist(restaurantId: string): Promise<WaitlistEntry[]> {
    const all = await this.repository.findByRestaurantId(restaurantId);
    return all.filter((e) => e.status.isActive());
  }

  async getPosition(id: string, restaurantId: string): Promise<number> {
    const active = await this.getActiveWaitlist(restaurantId);
    const sorted = this.priorityCalculator.sortByPriority(active);
    const index = sorted.findIndex((e) => e.id === id);
    return index === -1 ? -1 : index + 1;
  }

  private generateId(): string {
    return `wl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
