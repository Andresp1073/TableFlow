export interface UpdateTableTypeCommand {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  description?: string | null;
  defaultCapacity: number;
  minimumCapacity: number;
  maximumCapacity: number;
  shape: string;
  isReservable?: boolean;
  displayOrder?: number;
  metadata?: Record<string, unknown> | null;
}
