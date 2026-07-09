export interface CalendarExceptionDTO {
  id: string;
  restaurantId: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  allDay: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}
