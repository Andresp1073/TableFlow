import type { KitchenPriority } from "../../domain/models/KitchenPriority.js";
import type { TicketStatus } from "../../domain/models/KitchenTicket.js";

export interface CreateKitchenTicketDto {
  restaurantId: string;
  kitchenId: string;
  orderId: string;
  stationId: string;
  tableId?: string;
  customerName?: string;
  customerCount?: number;
  priority: KitchenPriority;
  items: CreateKitchenTicketItemDto[];
  notes?: string[];
}

export interface CreateKitchenTicketItemDto {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  stationId: string;
  modifiers?: string[];
  notes?: string;
  estimatedPrepTimeSeconds?: number;
}

export interface KitchenTicketResponseDto {
  id: string;
  restaurantId: string;
  kitchenId: string;
  orderId: string;
  stationId: string;
  priority: KitchenPriority;
  status: TicketStatus;
  items: KitchenTicketItemResponseDto[];
  notes: string[];
  createdAt: Date;
  acceptedAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  deliveredAt: Date | null;
}

export interface KitchenTicketItemResponseDto {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  status: string;
  stationId: string;
  modifiers: string[];
}
