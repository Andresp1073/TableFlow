export interface TableGroupMemberDTO {
  tableId: string;
  displayOrder: number;
  joinedAt: string;
}

export interface TableGroupDTO {
  id: string;
  restaurantId: string;
  name: string;
  description: string | null;
  status: string;
  isActive: boolean;
  createdBy: string;
  members: TableGroupMemberDTO[];
  createdAt: string;
  updatedAt: string;
  releasedAt: string | null;
}
