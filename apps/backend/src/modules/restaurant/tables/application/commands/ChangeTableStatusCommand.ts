export interface ChangeTableStatusCommand {
  id: string;
  restaurantId: string;
  status: string;
  reason?: string | null;
}
