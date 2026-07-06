export interface BranchDTO {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  defaultDineDuration: number;
  maxPartySize: number;
  advanceBookingDays: number;
  minNoticeMinutes: number;
  autoConfirm: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchRequest {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  defaultDineDuration?: number;
  maxPartySize?: number;
  advanceBookingDays?: number;
  minNoticeMinutes?: number;
  autoConfirm?: boolean;
}

export interface OperatingHourDTO {
  id: string;
  branchId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}
