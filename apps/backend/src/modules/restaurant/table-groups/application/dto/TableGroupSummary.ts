export interface TableGroupSummary {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  status: string;
  isActive: boolean;
  memberCount: number;
  totalCapacity: number;
  createdAt: string;
  updatedAt: string;
}
