import { describe, it, expect } from "vitest";
import {
  SynchronousReplicationPolicy,
  AsynchronousReplicationPolicy,
  EventualConsistencyReplicationPolicy,
  ReadReplicasReplicationPolicy,
  createReplicationPolicy,
} from "../ReplicationPolicy.js";
import type { ReplicationConfig } from "../types.js";

describe("ReplicationPolicy", () => {
  const config: ReplicationConfig = {
    id: "repl-us-east-to-west",
    sourceRegionId: "us-east",
    targetRegionId: "us-west",
    mode: "synchronous",
    rpoTargetMs: 1000,
    batched: false,
    batchSize: 100,
    batchIntervalMs: 1000,
    retryPolicy: { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true },
    conflictResolution: { type: "lww" },
    enabled: true,
  };

  it("synchronous replication reports low lag", () => {
    const policy = new SynchronousReplicationPolicy();
    const status = policy.getStatus(config);

    expect(status.configId).toBe("repl-us-east-to-west");
    expect(status.healthy).toBe(true);
    expect(status.lagMs).toBeLessThan(100);
  });

  it("asynchronous replication reports moderate lag", () => {
    const policy = new AsynchronousReplicationPolicy();
    const status = policy.getStatus(config);

    expect(status.healthy).toBe(true);
    expect(status.lagMs).toBeGreaterThanOrEqual(50);
  });

  it("eventual consistency reports higher lag", () => {
    const policy = new EventualConsistencyReplicationPolicy();
    const status = policy.getStatus(config);

    expect(status.lagMs).toBeGreaterThanOrEqual(200);
  });

  it("read replicas reports minimal lag", () => {
    const policy = new ReadReplicasReplicationPolicy();
    const status = policy.getStatus(config);

    expect(status.lagMs).toBeLessThan(100);
  });

  it("validates valid config returns no errors", () => {
    const policy = new SynchronousReplicationPolicy();
    const errors = policy.validate(config);
    expect(errors).toHaveLength(0);
  });

  it("validates invalid config returns errors", () => {
    const policy = new SynchronousReplicationPolicy();
    const invalid: ReplicationConfig = {
      id: "",
      sourceRegionId: "",
      targetRegionId: "",
      mode: "invalid" as any,
      rpoTargetMs: 0,
      batched: true,
      batchSize: 0,
      batchIntervalMs: 0,
      retryPolicy: { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true },
      conflictResolution: { type: "lww" },
      enabled: true,
    };

    const errors = policy.validate(invalid);
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });

  it("validates source and target are different", () => {
    const policy = new SynchronousReplicationPolicy();
    const sameRegion: ReplicationConfig = {
      ...config, id: "test", sourceRegionId: "us-east", targetRegionId: "us-east",
    };

    const errors = policy.validate(sameRegion);
    expect(errors).toContain("Source and target regions must be different");
  });

  it("validates batch parameters when batched", () => {
    const policy = new SynchronousReplicationPolicy();
    const badBatch: ReplicationConfig = {
      ...config, batched: true, batchSize: 0, batchIntervalMs: 0,
    };

    const errors = policy.validate(badBatch);
    expect(errors.some((e) => e.includes("batch"))).toBe(true);
  });

  it("factory creates correct policies", () => {
    expect(createReplicationPolicy("synchronous")).toBeInstanceOf(SynchronousReplicationPolicy);
    expect(createReplicationPolicy("asynchronous")).toBeInstanceOf(AsynchronousReplicationPolicy);
    expect(createReplicationPolicy("eventual_consistency")).toBeInstanceOf(EventualConsistencyReplicationPolicy);
    expect(createReplicationPolicy("read_replicas")).toBeInstanceOf(ReadReplicasReplicationPolicy);
  });
});
