export interface UpdateDiningAreaCommand {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  description?: string | null;
  displayOrder?: number;
  isReservable?: boolean;
}
