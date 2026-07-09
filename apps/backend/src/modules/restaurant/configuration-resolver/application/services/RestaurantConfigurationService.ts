import type { AuthorizationContext } from "../../../../authorization/domain/models/AuthorizationContext.js";
import type { AuthorizationService } from "../../../../authorization/application/services/AuthorizationService.js";
import type { CacheProvider } from "../../../../../shared/cache/domain/CacheProvider.js";
import type { RestaurantRepository } from "../../../domain/repositories/RestaurantRepository.js";
import type { RestaurantSettingsRepository } from "../../../settings/domain/repositories/RestaurantSettingsRepository.js";
import type { ReservationPolicyRepository } from "../../../reservation-policy/domain/repositories/ReservationPolicyRepository.js";
import type { BusinessHoursRepository } from "../../../business-hours/domain/repositories/BusinessHoursRepository.js";
import type { CalendarExceptionRepository } from "../../../calendar-exceptions/domain/repositories/CalendarExceptionRepository.js";
import type { GetRestaurantConfigurationQuery } from "../queries/GetRestaurantConfigurationQuery.js";
import type { RestaurantConfigurationDTO } from "../dtos/RestaurantConfigurationDTO.js";
import { RestaurantConfigurationResolver } from "./RestaurantConfigurationResolver.js";
import { RestaurantConfigurationMapper } from "../mappers/RestaurantConfigurationMapper.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CONFIG_CACHE_KEY_PREFIX = "restaurant:config:";

export class RestaurantConfigurationService {
  private readonly resolver: RestaurantConfigurationResolver;

  constructor(
    restaurantRepository: RestaurantRepository,
    settingsRepository: RestaurantSettingsRepository,
    policyRepository: ReservationPolicyRepository,
    businessHoursRepository: BusinessHoursRepository,
    calendarExceptionRepository: CalendarExceptionRepository,
    private readonly authorizationService: AuthorizationService,
    private readonly cache?: CacheProvider,
  ) {
    this.resolver = new RestaurantConfigurationResolver(
      restaurantRepository,
      settingsRepository,
      policyRepository,
      businessHoursRepository,
      calendarExceptionRepository,
    );
  }

  async get(
    query: GetRestaurantConfigurationQuery,
    auth: AuthorizationContext,
  ): Promise<RestaurantConfigurationDTO> {
    await this.authorize(auth, "restaurants.read");

    const cached = await this.getFromCache(query.restaurantId);
    if (cached) return cached;

    const config = await this.resolver.resolve(query.restaurantId);
    const dto = RestaurantConfigurationMapper.toDTO(config);

    await this.setCache(query.restaurantId, dto);
    return dto;
  }

  async refresh(
    query: GetRestaurantConfigurationQuery,
    auth: AuthorizationContext,
  ): Promise<RestaurantConfigurationDTO> {
    await this.authorize(auth, "restaurants.read");

    await this.invalidateCache(query.restaurantId);

    const config = await this.resolver.resolve(query.restaurantId);
    const dto = RestaurantConfigurationMapper.toDTO(config);

    await this.setCache(query.restaurantId, dto);
    return dto;
  }

  private async authorize(auth: AuthorizationContext, permission: string): Promise<void> {
    await this.authorizationService.authorize(auth, permission);
  }

  private cacheKey(restaurantId: string): string {
    return `${CONFIG_CACHE_KEY_PREFIX}${restaurantId}`;
  }

  private async getFromCache(restaurantId: string): Promise<RestaurantConfigurationDTO | null> {
    if (!this.cache) return null;
    return this.cache.get<RestaurantConfigurationDTO>(this.cacheKey(restaurantId)) ?? null;
  }

  private async setCache(restaurantId: string, dto: RestaurantConfigurationDTO): Promise<void> {
    if (!this.cache) return;
    await this.cache.set(this.cacheKey(restaurantId), dto, CACHE_TTL_MS);
  }

  private async invalidateCache(restaurantId: string): Promise<void> {
    if (!this.cache) return;
    await this.cache.delete(this.cacheKey(restaurantId));
  }
}
