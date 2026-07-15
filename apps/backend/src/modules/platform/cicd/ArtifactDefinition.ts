import type { ArtifactConfig, ArtifactType, ArtifactResult, ArtifactStatus } from "./types.js";
import { ARTIFACT_TYPES } from "./types.js";
import { PipelineValidationError } from "./errors.js";
import { generateEventId } from "../event-bus/EventMetadata.js";

export class ArtifactDefinition {
  readonly type: ArtifactType;
  readonly name: string;
  readonly description: string;
  readonly path: string;
  readonly retentionDays: number;
  readonly tags: readonly string[];
  readonly compress: boolean;

  constructor(config: ArtifactConfig) {
    if (!ARTIFACT_TYPES.includes(config.type)) {
      throw new PipelineValidationError(`Invalid artifact type: ${config.type}`, []);
    }

    this.type = config.type;
    this.name = config.name;
    this.description = config.description ?? "";
    this.path = config.path;
    this.retentionDays = config.retentionDays ?? 90;
    this.tags = Object.freeze([...(config.tags ?? [])]);
    this.compress = config.compress ?? true;
  }

  createResult(
    version: string,
    status: ArtifactStatus,
    overrides?: Partial<Omit<ArtifactResult, "id" | "type" | "name" | "version" | "status" | "path" | "metadata">>,
  ): ArtifactResult {
    const now = new Date();
    const retentionExpiresAt = new Date(now.getTime() + this.retentionDays * 86_400_000);

    return {
      id: generateEventId(),
      type: this.type,
      name: this.name,
      version,
      status,
      path: this.path,
      publishedAt: overrides?.publishedAt ?? (status === "published" ? now : undefined),
      retentionExpiresAt,
      sizeBytes: overrides?.sizeBytes,
      checksum: overrides?.checksum,
      metadata: {},
    };
  }
}
