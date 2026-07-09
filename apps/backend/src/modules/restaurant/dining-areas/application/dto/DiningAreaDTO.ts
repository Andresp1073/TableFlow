export interface DiningAreaDTO {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  description: string | null;
  displayOrder: number;
  status: string;
  isReservable: boolean;
  createdAt: string;
  updatedAt: string;
}
