import type { KitchenPriority } from "./KitchenPriority.js";
import type { PreparationTask } from "./PreparationTask.js";

export enum TicketStatus {
  New = "new",
  Accepted = "accepted",
  Preparing = "preparing",
  Ready = "ready",
  Delivered = "delivered",
  Cancelled = "cancelled",
}

export const TICKET_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  [TicketStatus.New]: [TicketStatus.Accepted, TicketStatus.Cancelled],
  [TicketStatus.Accepted]: [TicketStatus.Preparing, TicketStatus.Cancelled],
  [TicketStatus.Preparing]: [TicketStatus.Ready, TicketStatus.Cancelled],
  [TicketStatus.Ready]: [TicketStatus.Delivered, TicketStatus.Cancelled],
  [TicketStatus.Delivered]: [],
  [TicketStatus.Cancelled]: [],
};

export interface KitchenTicketConfig {
  id: string;
  restaurantId: string;
  kitchenId: string;
  orderId: string;
  stationId: string;
  tableId?: string;
  customerName?: string;
  customerCount?: number;
  priority: KitchenPriority;
  status: TicketStatus;
  items: PreparationTask[];
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
  acceptedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

export class KitchenTicket {
  private constructor(public readonly value: KitchenTicketConfig) {}

  static create(config: Omit<KitchenTicketConfig, "status" | "createdAt" | "updatedAt" | "acceptedAt" | "startedAt" | "completedAt" | "deliveredAt" | "cancelledAt" | "cancellationReason">): KitchenTicket {
    const now = new Date();
    return new KitchenTicket({
      ...config,
      status: TicketStatus.New,
      createdAt: now,
      updatedAt: now,
      acceptedAt: null,
      startedAt: null,
      completedAt: null,
      deliveredAt: null,
      cancelledAt: null,
      cancellationReason: null,
    });
  }

  static reconstitute(config: KitchenTicketConfig): KitchenTicket {
    return new KitchenTicket(config);
  }

  equals(other: KitchenTicket): boolean {
    return this.value.id === other.value.id;
  }

  get id(): string {
    return this.value.id;
  }

  get restaurantId(): string {
    return this.value.restaurantId;
  }

  get kitchenId(): string {
    return this.value.kitchenId;
  }

  get orderId(): string {
    return this.value.orderId;
  }

  get stationId(): string {
    return this.value.stationId;
  }

  get tableId(): string | undefined {
    return this.value.tableId;
  }

  get customerName(): string | undefined {
    return this.value.customerName;
  }

  get customerCount(): number | undefined {
    return this.value.customerCount;
  }

  get priority(): KitchenPriority {
    return this.value.priority;
  }

  get status(): TicketStatus {
    return this.value.status;
  }

  get items(): readonly PreparationTask[] {
    return this.value.items;
  }

  get notes(): readonly string[] {
    return this.value.notes;
  }

  get createdAt(): Date {
    return this.value.createdAt;
  }

  get updatedAt(): Date {
    return this.value.updatedAt;
  }

  get acceptedAt(): Date | null {
    return this.value.acceptedAt;
  }

  get startedAt(): Date | null {
    return this.value.startedAt;
  }

  get completedAt(): Date | null {
    return this.value.completedAt;
  }

  get deliveredAt(): Date | null {
    return this.value.deliveredAt;
  }

  get cancelledAt(): Date | null {
    return this.value.cancelledAt;
  }

  get cancellationReason(): string | null {
    return this.value.cancellationReason;
  }

  canTransitionTo(target: TicketStatus): boolean {
    const allowed = TICKET_TRANSITIONS[this.value.status];
    return allowed.includes(target);
  }

  transitionTo(target: TicketStatus, reason?: string): KitchenTicket {
    if (!this.canTransitionTo(target)) {
      throw new Error(
        `Cannot transition from ${this.value.status} to ${target}`,
      );
    }

    const now = new Date();
    const updates: Partial<KitchenTicketConfig> = {
      status: target,
      updatedAt: now,
    };

    if (target === TicketStatus.Accepted) updates.acceptedAt = now;
    if (target === TicketStatus.Preparing) updates.startedAt = now;
    if (target === TicketStatus.Ready) updates.completedAt = now;
    if (target === TicketStatus.Delivered) updates.deliveredAt = now;
    if (target === TicketStatus.Cancelled) {
      updates.cancelledAt = now;
      updates.cancellationReason = reason ?? null;
    }

    return KitchenTicket.reconstitute({ ...this.value, ...updates });
  }

  accept(): KitchenTicket {
    return this.transitionTo(TicketStatus.Accepted);
  }

  startPreparing(): KitchenTicket {
    const started = this.transitionTo(TicketStatus.Preparing);
    const startedItems = started.value.items.map((item) => {
      if (item.status === "pending") {
        return item.start();
      }
      return item;
    });
    return KitchenTicket.reconstitute({ ...started.value, items: startedItems });
  }

  completeItem(taskId: string): KitchenTicket {
    const updatedItems = this.value.items.map((item) => {
      if (item.id === taskId) {
        return item.complete();
      }
      return item;
    });

    const allCompleted = updatedItems.every(
      (item) => item.status === "completed" || item.status === "skipped",
    );

    let ticket = KitchenTicket.reconstitute({
      ...this.value,
      items: updatedItems,
      updatedAt: new Date(),
    });

    if (allCompleted && ticket.status === TicketStatus.Preparing) {
      ticket = ticket.transitionTo(TicketStatus.Ready);
    }

    return ticket;
  }

  cancel(reason: string): KitchenTicket {
    return this.transitionTo(TicketStatus.Cancelled, reason);
  }

  deliver(): KitchenTicket {
    return this.transitionTo(TicketStatus.Delivered);
  }

  addNote(note: string): KitchenTicket {
    return KitchenTicket.reconstitute({
      ...this.value,
      notes: [...this.value.notes, note],
      updatedAt: new Date(),
    });
  }

  reassignStation(stationId: string): KitchenTicket {
    return KitchenTicket.reconstitute({
      ...this.value,
      stationId,
      updatedAt: new Date(),
    });
  }

  updatePriority(priority: KitchenPriority): KitchenTicket {
    return KitchenTicket.reconstitute({
      ...this.value,
      priority,
      updatedAt: new Date(),
    });
  }

  getWaitingTimeMs(): number {
    const start = this.value.startedAt ?? new Date();
    return start.getTime() - this.value.createdAt.getTime();
  }

  getPreparationTimeMs(): number | null {
    if (!this.value.startedAt) return null;
    const end = this.value.completedAt ?? new Date();
    return end.getTime() - this.value.startedAt.getTime();
  }

  getTotalTimeMs(): number | null {
    if (!this.value.completedAt) return null;
    return this.value.completedAt.getTime() - this.value.createdAt.getTime();
  }

  isDelayed(slaMs: number): boolean {
    if (this.value.completedAt) {
      return this.value.completedAt.getTime() - this.value.createdAt.getTime() > slaMs;
    }
    return Date.now() - this.value.createdAt.getTime() > slaMs;
  }
}
