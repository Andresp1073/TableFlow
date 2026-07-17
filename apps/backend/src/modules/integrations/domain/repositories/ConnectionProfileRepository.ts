import type { ConnectionProfile, ConnectionStatus } from "../models/ConnectionProfile.js";

export interface ConnectionProfileRepository {
  save(profile: ConnectionProfile): Promise<void>;
  findById(id: string): Promise<ConnectionProfile | null>;
  findByIntegration(integrationId: string): Promise<ConnectionProfile[]>;
  findByRestaurant(restaurantId: string): Promise<ConnectionProfile[]>;
  findByStatus(restaurantId: string, status: ConnectionStatus): Promise<ConnectionProfile[]>;
  findActiveByIntegration(integrationId: string): Promise<ConnectionProfile | null>;
  delete(id: string): Promise<void>;
}
