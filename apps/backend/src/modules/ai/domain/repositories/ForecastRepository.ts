import type { Forecast, ForecastType } from "../models/Forecast.js";

export interface ForecastRepository {
  save(forecast: Forecast): Promise<void>;
  findById(id: string): Promise<Forecast | null>;
  findByRestaurant(restaurantId: string): Promise<Forecast[]>;
  findByType(restaurantId: string, type: ForecastType): Promise<Forecast[]>;
  findByPeriod(restaurantId: string, start: Date, end: Date): Promise<Forecast[]>;
  findLatestByType(restaurantId: string, type: ForecastType): Promise<Forecast | null>;
  delete(id: string): Promise<void>;
}
