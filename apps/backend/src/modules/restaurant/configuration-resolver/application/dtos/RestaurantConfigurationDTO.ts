export interface RestaurantInfoDTO {
  id: string;
  name: string;
  slug: string;
  status: string;
  timezone: string;
  currency: string;
  language: string;
  isActive: boolean;
}

export interface RestaurantConfigurationMetadataDTO {
  retrievedAt: string;
  version: string;
}

export interface RestaurantConfigurationDTO {
  restaurant: RestaurantInfoDTO;
  settings: Record<string, unknown> | null;
  reservationPolicy: Record<string, unknown> | null;
  businessHours: Record<string, unknown> | null;
  calendarExceptions: Record<string, unknown>[];
  metadata: RestaurantConfigurationMetadataDTO;
}
