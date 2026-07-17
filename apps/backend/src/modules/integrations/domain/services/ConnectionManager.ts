import type { ConnectionProfileRepository } from "../repositories/ConnectionProfileRepository.js";
import { ConnectionProfile, type AuthType } from "../models/ConnectionProfile.js";
import { IntegrationConnected } from "../events/IntegrationConnected.js";
import { IntegrationDisconnected } from "../events/IntegrationDisconnected.js";
import { IntegrationFailed } from "../events/IntegrationFailed.js";

export interface CreateConnectionParams {
  integrationId: string;
  restaurantId: string;
  name: string;
  authType: AuthType;
  credentialsRef: string;
  baseUrl?: string;
  maxRetries?: number;
}

export class ConnectionManager {
  readonly events: unknown[] = [];

  constructor(private readonly profileRepo: ConnectionProfileRepository) {}

  async createConnection(params: CreateConnectionParams): Promise<ConnectionProfile> {
    const profile = ConnectionProfile.create({
      id: crypto.randomUUID(),
      integrationId: params.integrationId,
      restaurantId: params.restaurantId,
      name: params.name,
      authType: params.authType,
      credentialsRef: params.credentialsRef,
      baseUrl: params.baseUrl,
      maxRetries: params.maxRetries ?? 3,
    });
    await this.profileRepo.save(profile);
    return profile;
  }

  async connect(profileId: string): Promise<ConnectionProfile> {
    const profile = await this.profileRepo.findById(profileId);
    if (!profile) throw new Error(`Connection profile not found: ${profileId}`);

    const connected = profile.connect();
    await this.profileRepo.save(connected);

    this.events.push(new IntegrationConnected(
      connected.integrationId, connected.restaurantId, connected.id,
    ));

    return connected;
  }

  async disconnect(profileId: string, reason?: string): Promise<ConnectionProfile> {
    const profile = await this.profileRepo.findById(profileId);
    if (!profile) throw new Error(`Connection profile not found: ${profileId}`);

    const disconnected = profile.disconnect();
    await this.profileRepo.save(disconnected);

    this.events.push(new IntegrationDisconnected(
      disconnected.integrationId, disconnected.restaurantId, disconnected.id, reason,
    ));

    return disconnected;
  }

  async fail(profileId: string, error: string): Promise<ConnectionProfile> {
    const profile = await this.profileRepo.findById(profileId);
    if (!profile) throw new Error(`Connection profile not found: ${profileId}`);

    const failed = profile.fail(error);

    if (failed.canRetry()) {
      const retried = failed.incrementRetry();
      await this.profileRepo.save(retried);
    } else {
      await this.profileRepo.save(failed);
    }

    this.events.push(new IntegrationFailed(
      failed.integrationId, failed.restaurantId, error,
    ));

    return failed.canRetry() ? failed.incrementRetry() : failed;
  }

  async getProfile(profileId: string): Promise<ConnectionProfile | null> {
    return this.profileRepo.findById(profileId);
  }

  async getProfilesByIntegration(integrationId: string): Promise<ConnectionProfile[]> {
    return this.profileRepo.findByIntegration(integrationId);
  }

  async getProfilesByRestaurant(restaurantId: string): Promise<ConnectionProfile[]> {
    return this.profileRepo.findByRestaurant(restaurantId);
  }

  async getActiveProfile(integrationId: string): Promise<ConnectionProfile | null> {
    return this.profileRepo.findActiveByIntegration(integrationId);
  }
}
