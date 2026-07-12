export interface CreateTableGroupCommand {
  restaurantId: string;
  name: string;
  description?: string | null;
  tableIds: string[];
}
