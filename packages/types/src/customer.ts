export interface CustomerDTO {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  totalVisits: number;
  totalNoShows: number;
  isVip: boolean;
  isFlagged: boolean;
  preferences?: Record<string, unknown>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  isVip?: boolean;
  isFlagged?: boolean;
}
