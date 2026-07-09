import type { DiningArea } from "../models/DiningArea.js";
import type { DiningAreaName } from "../models/DiningAreaName.js";
import type { DiningAreaCode } from "../models/DiningAreaCode.js";
import type { DisplayOrder } from "../models/DisplayOrder.js";
import type { DiningAreaStatus } from "../models/DiningAreaStatus.js";

export interface CreateDiningAreaData {
  restaurantId: string;
  name: DiningAreaName;
  code: DiningAreaCode;
  description?: string | null;
  displayOrder: DisplayOrder;
  status?: DiningAreaStatus;
  isReservable?: boolean;
}

export interface ReconstituteDiningAreaData {
  id: string;
  restaurantId: string;
  name: string;
  code: string;
  description: string | null;
  displayOrder: number;
  status: string;
  isReservable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiningAreaFactory {
  create(data: CreateDiningAreaData): DiningArea;
  reconstitute(data: ReconstituteDiningAreaData): DiningArea;
}
