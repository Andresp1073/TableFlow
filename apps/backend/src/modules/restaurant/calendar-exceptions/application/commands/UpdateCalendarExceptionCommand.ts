export interface UpdateCalendarExceptionCommand {
  id: string;
  restaurantId: string;
  title: string;
  description?: string;
  type: string;
  date: string;
  isClosed: boolean;
  openTime?: string;
  closeTime?: string;
  allDay: boolean;
  priority?: number;
}
