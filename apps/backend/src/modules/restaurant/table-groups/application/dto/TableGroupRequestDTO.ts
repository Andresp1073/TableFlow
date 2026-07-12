export interface CreateTableGroupRequest {
  restaurantId: string;
  name: string;
  description?: string | null;
  tableIds: string[];
}

export interface UpdateTableGroupRequest {
  name?: string;
  description?: string | null;
  tableIds?: string[];
}
