export interface DiningArea {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  description: string | null;
  displayOrder: number;
  status: DiningAreaStatus;
  isReservable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DiningAreaStatus = 'active' | 'archived';

export interface DiningAreaCreateInput {
  name: string;
  code: string;
  description?: string | null;
  displayOrder?: number;
  isReservable?: boolean;
}

export interface DiningAreaUpdateInput {
  name?: string;
  code?: string;
  description?: string | null;
  displayOrder?: number;
  isReservable?: boolean;
}

export interface DiningAreaListParams {
  status?: DiningAreaStatus;
}

export const DINING_AREA_STATUS_OPTIONS: { value: DiningAreaStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

export const DINING_AREA_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'displayOrder', label: 'Display Order' },
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
];
