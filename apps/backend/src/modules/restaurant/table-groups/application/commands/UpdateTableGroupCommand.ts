export interface UpdateTableGroupCommand {
  id: string;
  restaurantId: string;
  name?: string;
  description?: string | null;
  tableIds?: string[];
  updatedBy: string;
}
