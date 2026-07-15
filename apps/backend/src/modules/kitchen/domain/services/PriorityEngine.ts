import {
  KitchenPriority,
  KITCHEN_PRIORITY_ORDER,
  isHigherPriority,
} from "../models/KitchenPriority.js";
import type { KitchenTicket } from "../models/KitchenTicket.js";
import { TicketStatus } from "../models/KitchenTicket.js";

export interface PriorityScore {
  ticketId: string;
  basePriority: KitchenPriority;
  score: number;
  waitingTimeMs: number;
  isLate: boolean;
}

export class PriorityEngine {
  private readonly lateThresholdMs: number;
  private readonly waitingTimeWeight: number;

  constructor(lateThresholdMs = 600000, waitingTimeWeight = 0.3) {
    this.lateThresholdMs = lateThresholdMs;
    this.waitingTimeWeight = waitingTimeWeight;
  }

  calculateScore(ticket: KitchenTicket): number {
    const baseScore = KITCHEN_PRIORITY_ORDER[ticket.priority] * 25;
    const waitingTime = ticket.getWaitingTimeMs();
    const waitingBonus = (waitingTime / this.lateThresholdMs) * 100 * this.waitingTimeWeight;
    const latePenalty = ticket.isDelayed(this.lateThresholdMs) ? 50 : 0;

    return baseScore + waitingBonus + latePenalty;
  }

  assessTicket(ticket: KitchenTicket): PriorityScore {
    const score = this.calculateScore(ticket);

    let effectivePriority = ticket.priority;
    if (ticket.isDelayed(this.lateThresholdMs)) {
      effectivePriority = KitchenPriority.Delayed;
    }

    return {
      ticketId: ticket.id,
      basePriority: ticket.priority,
      score,
      waitingTimeMs: ticket.getWaitingTimeMs(),
      isLate: ticket.isDelayed(this.lateThresholdMs),
    };
  }

  assessTickets(tickets: KitchenTicket[]): PriorityScore[] {
    return tickets
      .filter((t) => !this.isTerminal(t.status))
      .map((t) => this.assessTicket(t))
      .sort((a, b) => b.score - a.score);
  }

  getNextTicket(tickets: KitchenTicket[]): KitchenTicket | null {
    const active = tickets.filter(
      (t) => t.status === TicketStatus.New || t.status === TicketStatus.Accepted,
    );

    if (active.length === 0) return null;

    return active.sort((a, b) => {
      const scoreA = this.calculateScore(a);
      const scoreB = this.calculateScore(b);
      return scoreB - scoreA;
    })[0];
  }

  getSortedByPriority(tickets: KitchenTicket[]): KitchenTicket[] {
    return [...tickets].sort((a, b) => {
      const priorityCmp = isHigherPriority(b.priority, a.priority) ? 1 : -1;
      if (priorityCmp !== 0) return priorityCmp;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private isTerminal(status: TicketStatus): boolean {
    return status === TicketStatus.Delivered
      || status === TicketStatus.Cancelled;
  }
}
