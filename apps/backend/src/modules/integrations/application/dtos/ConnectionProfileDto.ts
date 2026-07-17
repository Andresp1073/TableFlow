import type { ConnectionProfile, ConnectionStatus, AuthType } from "../../domain/models/ConnectionProfile.js";

export interface ConnectionProfileDto {
  id: string;
  integrationId: string;
  restaurantId: string;
  name: string;
  authType: AuthType;
  credentialsRef: string;
  status: ConnectionStatus;
  baseUrl: string | null;
  lastConnectedAt: string | null;
  lastHealthCheckAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export function toConnectionProfileDto(profile: ConnectionProfile): ConnectionProfileDto {
  return {
    id: profile.id,
    integrationId: profile.integrationId,
    restaurantId: profile.restaurantId,
    name: profile.name,
    authType: profile.authType,
    credentialsRef: profile.credentialsRef,
    status: profile.status,
    baseUrl: profile.baseUrl ?? null,
    lastConnectedAt: profile.lastConnectedAt?.toISOString() ?? null,
    lastHealthCheckAt: profile.lastHealthCheckAt?.toISOString() ?? null,
    errorMessage: profile.errorMessage ?? null,
    retryCount: profile.retryCount,
    maxRetries: profile.maxRetries,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
