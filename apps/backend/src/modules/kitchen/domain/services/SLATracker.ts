import type { KitchenTicket } from "../models/KitchenTicket.js";
import { TicketStatus } from "../models/KitchenTicket.js";
import { KitchenPriority } from "../models/KitchenPriority.js";

export interface SLAConfig {
  normalMs: number;
  highMs: number;
  urgentMs: number;
  vipMs: number;
}

export interface SLAStatus {
  ticketId: string;
  isDelayed: boolean;
  elapsedMs: number;
  limitMs: number;
  remainingMs: number;
  status: "on_track" | "warning" | "delayed";
}

export const DEFAULT_SLA_CONFIG: SLAConfig = {
  normalMs: 600000,
  highMs: 450000,
  urgentMs: 300000,
  vipMs: 180000,
};

export class SLATracker {
  private readonly config: SLAConfig;

  constructor(config: SLAConfig = DEFAULT_SLA_CONFIG) {
    this.config = config;
  }

  getSLALimit(priority: KitchenPriority): number {
    switch (priority) {
      case KitchenPriority.Normal: return this.config.normalMs;
      case KitchenPriority.High: return this.config.highMs;
      case KitchenPriority.Urgent: return this.config.urgentMs;
      case KitchenPriority.VIP: return this.config.vipMs;
      case KitchenPriority.Delayed: return this.config.urgentMs;
    }
  }

  checkTicket(ticket: KitchenTicket): SLAStatus {
    const slaMs = this.getSLALimit(ticket.priority);
    const elapsedMs = this.getElapsedMs(ticket);

    let status: "on_track" | "warning" | "delayed";
    if (elapsedMs >= slaMs) {
      status = "delayed";
    } else if (elapsedMs >= slaMs * 0.8) {
      status = "warning";
    } else {
      status = "on_track";
    }

    return {
      ticketId: ticket.id,
      isDelayed: status === "delayed",
      elapsedMs,
      limitMs: slaMs,
      remainingMs: Math.max(0, slaMs - elapsedMs),
      status,
    };
  }

  getDelayedTickets(tickets: KitchenTicket[]): KitchenTicket[] {
    const active = tickets.filter(
      (t) => !this.isTerminal(t.status),
    );
    return active.filter((t) => this.checkTicket(t).isDelayed);
  }

  getSLASummary(tickets: KitchenTicket[]): {
    onTrack: number;
    warning: number;
    delayed: number;
    total: number;
    complianceRate: number;
  } {
    const active = tickets.filter(
      (t) => !this.isTerminal(t.status),
    );

    let onTrack = 0;
    let warning = 0;
    let delayed = 0;

    for (const ticket of active) {
      const status = this.checkTicket(ticket);
      if (status.status === "on_track") onTrack++;
      else if (status.status === "warning") warning++;
      else delayed++;
    }

    const total = onTrack + warning + delayed;

    return {
      onTrack,
      warning,
      delayed,
      total,
      complianceRate: total > 0 ? onTrack / total : 1,
    };
  }

  private getElapsedMs(ticket: KitchenTicket): number {
    const start = ticket.createdAt.getTime();
    const now = ticket.status === TicketStatus.Ready
      || ticket.status === TicketStatus.Delivered
      ? (ticket.completedAt ?? new Date()).getTime()
      : Date.now();
    return now - start;
  }

  private isTerminal(status: TicketStatus): boolean {
    return status === TicketStatus.Delivered
      || status === TicketStatus.Cancelled;
  }
}
