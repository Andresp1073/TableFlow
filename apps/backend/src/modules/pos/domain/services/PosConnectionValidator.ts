import type { PosConnection } from "../models/PosConnection.js";
import { PosConnectionStatus } from "../models/PosConnection.js";

export interface HealthCheckResult {
  isHealthy: boolean;
  latencyMs: number;
  errorMessage: string | null;
  timestamp: Date;
}

export interface ConnectionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PosConnectionValidator {
  validateConfiguration(configuration: Record<string, string>): ConnectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!configuration || Object.keys(configuration).length === 0) {
      errors.push("Configuration cannot be empty");
    }

    if (!configuration.apiKey && !configuration.accessToken) {
      warnings.push("No API key or access token provided");
    }

    if (configuration.apiKey && configuration.apiKey.length < 8) {
      errors.push("API key is too short");
    }

    if (configuration.apiUrl && !configuration.apiUrl.startsWith("https://")) {
      warnings.push("API URL should use HTTPS");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  canConnect(connection: PosConnection): boolean {
    return connection.status === PosConnectionStatus.Pending
      || connection.status === PosConnectionStatus.Disconnected
      || connection.status === PosConnectionStatus.Failed
      || connection.status === PosConnectionStatus.Expired;
  }

  canDisconnect(connection: PosConnection): boolean {
    return connection.status === PosConnectionStatus.Connected
      || connection.status === PosConnectionStatus.Failed
      || connection.status === PosConnectionStatus.Expired;
  }

  validateTransition(
    connection: PosConnection,
    target: PosConnectionStatus,
  ): ConnectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!connection.canTransitionTo(target)) {
      errors.push(
        `Cannot transition from ${connection.status} to ${target}`,
      );
    }

    if (target === PosConnectionStatus.Connected) {
      const configValidation = this.validateConfiguration(connection.configuration);
      errors.push(...configValidation.errors);
      warnings.push(...configValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
