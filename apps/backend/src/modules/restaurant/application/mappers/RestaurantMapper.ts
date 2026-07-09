import type { Restaurant } from "../../domain/models/Restaurant.js";
import type { RestaurantDTO } from "../dtos/RestaurantDTO.js";

export class RestaurantMapper {
  static toDTO(restaurant: Restaurant): RestaurantDTO {
    return {
      id: restaurant.id,
      name: restaurant.name.value,
      slug: restaurant.slug.value,
      legalName: restaurant.legalName,
      taxId: restaurant.taxId?.value ?? null,
      email: restaurant.email?.value ?? null,
      phone: restaurant.phone?.value ?? null,
      website: restaurant.website,
      logoUrl: restaurant.logoUrl,
      address: restaurant.address,
      status: restaurant.status.value,
      timezone: restaurant.timezone.value,
      currency: restaurant.currency.value,
      language: restaurant.language.value,
      createdAt: restaurant.createdAt.toISOString(),
      updatedAt: restaurant.updatedAt.toISOString(),
      deletedAt: restaurant.deletedAt?.toISOString() ?? null,
    };
  }
}
