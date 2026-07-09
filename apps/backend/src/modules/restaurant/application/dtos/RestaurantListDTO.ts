import type { RestaurantDTO } from "./RestaurantDTO.js";

export interface RestaurantListDTO {
  data: RestaurantDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
