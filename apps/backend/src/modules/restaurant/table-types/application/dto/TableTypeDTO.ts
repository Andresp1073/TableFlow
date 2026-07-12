export interface TableTypeDTO {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  description: string | null;
  defaultCapacity: number;
  minimumCapacity: number;
  maximumCapacity: number;
  shape: string;
  isReservable: boolean;
  displayOrder: number;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
