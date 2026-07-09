import type { DiningAreaName } from "./DiningAreaName.js";
import type { DiningAreaCode } from "./DiningAreaCode.js";
import type { DisplayOrder } from "./DisplayOrder.js";
import type { DiningAreaStatus } from "./DiningAreaStatus.js";

export interface DiningArea {
  id: string;
  restaurantId: string;
  name: DiningAreaName;
  code: DiningAreaCode;
  description: string | null;
  displayOrder: DisplayOrder;
  status: DiningAreaStatus;
  isReservable: boolean;
  createdAt: Date;
  updatedAt: Date;
}
