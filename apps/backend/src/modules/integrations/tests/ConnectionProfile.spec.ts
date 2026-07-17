import { describe, it, expect } from "vitest";
import { ConnectionProfile } from "../domain/models/ConnectionProfile.js";

describe("ConnectionProfile", () => {
  const baseConfig = {
    id: "conn-1", integrationId: "int-1", restaurantId: "rest-1",
    name: "Main Connection", authType: "api_key" as const,
    credentialsRef: "secret/erp-api-key", maxRetries: 3,
  };

  it("creates a connection in pending status", () => {
    const profile = ConnectionProfile.create(baseConfig);
    expect(profile.status).toBe("pending");
    expect(profile.retryCount).toBe(0);
  });

  it("transitions to connected state", () => {
    const profile = ConnectionProfile.create(baseConfig);
    const connected = profile.connect();
    expect(connected.status).toBe("connected");
    expect(connected.lastConnectedAt).toBeInstanceOf(Date);
  });

  it("transitions to disconnected state", () => {
    const profile = ConnectionProfile.create(baseConfig).connect();
    const disconnected = profile.disconnect();
    expect(disconnected.status).toBe("disconnected");
  });

  it("transitions to failed state", () => {
    const profile = ConnectionProfile.create(baseConfig);
    const failed = profile.fail("Auth expired");
    expect(failed.status).toBe("failed");
    expect(failed.errorMessage).toBe("Auth expired");
  });

  it("transitions to expired state", () => {
    const profile = ConnectionProfile.create(baseConfig);
    const expired = profile.expire();
    expect(expired.status).toBe("expired");
  });

  it("records health check timestamps", () => {
    const profile = ConnectionProfile.create(baseConfig);
    const recorded = profile.recordHealthCheck();
    expect(recorded.lastHealthCheckAt).toBeInstanceOf(Date);
  });

  it("increments retry count", () => {
    const profile = ConnectionProfile.create(baseConfig);
    const retried = profile.incrementRetry();
    expect(retried.retryCount).toBe(1);
  });

  it("resets retry count", () => {
    const profile = ConnectionProfile.create(baseConfig);
    const retried = profile.incrementRetry().incrementRetry();
    expect(retried.retryCount).toBe(2);
    const reset = retried.resetRetries();
    expect(reset.retryCount).toBe(0);
  });

  it("canRetry returns true when under max", () => {
    const profile = ConnectionProfile.create(baseConfig);
    expect(profile.canRetry()).toBe(true);
    const exhausted = profile.incrementRetry().incrementRetry().incrementRetry();
    expect(exhausted.canRetry()).toBe(false);
  });

  it("isConnected returns correct status", () => {
    const pending = ConnectionProfile.create(baseConfig);
    expect(pending.isConnected()).toBe(false);
    const connected = pending.connect();
    expect(connected.isConnected()).toBe(true);
  });

  it("reconstitutes from existing config", () => {
    const now = new Date();
    const profile = ConnectionProfile.reconstitute({
      ...baseConfig, status: "connected", retryCount: 2,
      lastConnectedAt: now, baseUrl: "https://api.example.com",
      createdAt: now, updatedAt: now,
    });
    expect(profile.status).toBe("connected");
    expect(profile.retryCount).toBe(2);
    expect(profile.baseUrl).toBe("https://api.example.com");
  });
});
