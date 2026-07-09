export interface CreateDiningAreaCommand {
  restaurantId: string;
  name: string;
  code: string;
  description?: string | null;
  displayOrder?: number;
  isReservable?: boolean;
}
