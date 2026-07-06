export interface TableDTO {
  id: string;
  branchId: string;
  tableNumber: string;
  minCapacity: number;
  maxCapacity: number;
  zone?: string;
  features?: string[];
  positionX?: number;
  positionY?: number;
  status: string;
  isActive: boolean;
}

export interface CreateTableRequest {
  tableNumber: string;
  minCapacity: number;
  maxCapacity: number;
  zone?: string;
  features?: string[];
  positionX?: number;
  positionY?: number;
}

export interface UpdateTableRequest {
  tableNumber?: string;
  minCapacity?: number;
  maxCapacity?: number;
  zone?: string;
  features?: string[];
  status?: string;
  positionX?: number;
  positionY?: number;
}
