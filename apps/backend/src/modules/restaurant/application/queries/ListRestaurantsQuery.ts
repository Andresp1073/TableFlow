import type { RestaurantStatusValue } from "../../domain/models/RestaurantStatus.js";

export interface ListRestaurantsQuery {
  page?: number;
  limit?: number;
  status?: RestaurantStatusValue;
  search?: string;
  sortBy?: "name" | "slug" | "createdAt" | "updatedAt" | "status";
  sortOrder?: "asc" | "desc";
}
