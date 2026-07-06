export interface ReservationDTO {
  id: string;
  branchId: string;
  customerId: string;
  tableId?: string;
  confirmationCode: string;
  partySize: number;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
  specialRequests?: string;
  walkIn: boolean;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  branchId: string;
  customerId?: string;
  customer?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  partySize: number;
  reservationDate: string;
  startTime: string;
  tableId?: string;
  specialRequests?: string;
  walkIn?: boolean;
}

export interface UpdateReservationRequest {
  partySize?: number;
  startTime?: string;
  tableId?: string;
  specialRequests?: string;
  status?: string;
}

export interface AvailabilityQuery {
  branchId: string;
  date: string;
  partySize: number;
  time?: string;
}

export interface AvailableSlot {
  time: string;
  available: boolean;
  suggestedTables: Array<{
    id: string;
    tableNumber: string;
    maxCapacity: number;
    zone?: string;
  }>;
}
