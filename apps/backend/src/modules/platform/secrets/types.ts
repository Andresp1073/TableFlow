import type { Logger } from "../observability/types.js";
import type { EventPublisher } from "../event-bus/types.js";
import type { CacheProvider, SetCacheOptions } from "../cache/types.js";

export enum SecretType {
  DatabaseCredentials = "database_credentials",
  JwtSigningKey = "jwt_signing_key",
  ApiKey = "api_key",
  SmtpCredentials = "smtp_credentials",
  StorageCredentials = "storage_credentials",
  WebhookSecret = "webhook_secret",
  EncryptionKey = "encryption_key",
  OAuthClientSecret = "oauth_client_secret",
}

export interface DatabaseCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  connectionString?: string;
}

export interface JwtSigningKeyValue {
  key: string;
  algorithm: string;
  kid?: string;
  publicKey?: string;
}

export interface ApiKeyValue {
  key: string;
  prefix?: string;
  permissions?: string[];
}

export interface SmtpCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  secure?: boolean;
  fromAddress?: string;
}

export interface StorageCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  bucket?: string;
  endpoint?: string;
}

export interface WebhookSecretValue {
  secret: string;
  url?: string;
  signatureHeader?: string;
}

export interface EncryptionKeyValue {
  key: string;
  algorithm: string;
  initializationVector?: string;
  keyId?: string;
}

export interface OAuthClientSecretValue {
  clientId: string;
  clientSecret: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
}

export type SecretPayload =
  | DatabaseCredentials
  | JwtSigningKeyValue
  | ApiKeyValue
  | SmtpCredentials
  | StorageCredentials
  | WebhookSecretValue
  | EncryptionKeyValue
  | OAuthClientSecretValue;

export type SecretVersionStatus = "active" | "previous" | "deprecated" | "compromised";

export interface SecretVersion {
  version: number;
  value: SecretPayload;
  createdAt: Date;
  createdBy?: string;
  status: SecretVersionStatus;
}

export interface SecretRotationPolicyConfig {
  maxAgeMs: number;
  rotateBeforeExpiryMs: number;
  versionsToKeep: number;
  autoRotate: boolean;
  notifyOnRotation: boolean;
  allowedRotationWindow?: { start: string; end: string };
  requireApproval?: boolean;
}

export interface SecretMetadata {
  id: string;
  key: string;
  type: SecretType;
  name: string;
  description?: string;
  tags?: string[];
  currentVersion: number;
  versions: SecretVersion[];
  expiresAt?: Date;
  lastRotatedAt?: Date;
  rotationPolicy?: SecretRotationPolicyConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface Secret {
  metadata: SecretMetadata;
  current: SecretPayload;
}

export interface SecretSourceConfig {
  name: string;
  priority: number;
  enabled: boolean;
}

export interface SecretSource {
  readonly name: string;
  readonly priority: number;
  readonly enabled: boolean;
  get(type: SecretType, key: string): Promise<Secret | null>;
  has(type: SecretType, key: string): Promise<boolean>;
  getAll(): Promise<Secret[]>;
}

export interface RotationStatus {
  secretKey: string;
  currentVersion: number;
  expiresAt: Date | null;
  lastRotatedAt: Date | null;
  status: "ok" | "expiring_soon" | "expired" | "rotation_required" | "compromised";
  daysUntilExpiry: number | null;
  policy: SecretRotationPolicyConfig;
}

export type SecretValidationErrorCode =
  | "missing_required"
  | "invalid_format"
  | "expired_secret"
  | "version_outdated"
  | "weak_secret"
  | "invalid_type";

export interface SecretValidationError {
  field: string;
  message: string;
  code: SecretValidationErrorCode;
}

export interface SecretValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface SecretValidationResult {
  valid: boolean;
  errors: SecretValidationError[];
  warnings: SecretValidationWarning[];
}

export type SecretEventType =
  | "secret.loaded"
  | "secret.rotated"
  | "secret.expired"
  | "secret.validation_failed";

export interface SecretEvent {
  type: SecretEventType;
  secretKey: string;
  secretType: SecretType;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface SecretCacheConfig {
  ttlMs: number;
  enabled: boolean;
}

export interface SecretProvider {
  getSecret<T extends SecretPayload>(key: string, type: SecretType): Promise<T | null>;
  getSecretOrFail<T extends SecretPayload>(key: string, type: SecretType): Promise<T>;
  hasSecret(key: string, type: SecretType): Promise<boolean>;
  getSecretMetadata(key: string): Promise<SecretMetadata | null>;
  refreshSecret(key: string): Promise<void>;
  getRotationStatus(key: string): Promise<RotationStatus | null>;
}

export interface SecretManagerInterface {
  readonly provider: SecretProvider;
  addSource(source: SecretSource): void;
  removeSource(name: string): void;
  getSources(): SecretSource[];
  registerSecret(metadata: Omit<SecretMetadata, "id" | "createdAt" | "updatedAt">): SecretMetadata;
  getRegisteredMetadata(key: string): SecretMetadata | null;
  getRegisteredSecrets(): Map<string, SecretMetadata>;
  rotateSecret(key: string, newValue: SecretPayload, rotatedBy?: string): Promise<Secret>;
  validateSecret(key: string): Promise<SecretValidationResult>;
  validateAllSecrets(): Promise<Map<string, SecretValidationResult>>;
  setLogger(logger: Logger): void;
  setEventPublisher(publisher: EventPublisher): void;
  setCacheProvider(provider: CacheProvider, config?: SecretCacheConfig, options?: SetCacheOptions): void;
}

export const DEFAULT_SECRET_SOURCE_PRIORITY: SecretSourceConfig[] = [
  { name: "environment", priority: 10, enabled: true },
  { name: "configuration", priority: 20, enabled: true },
  { name: "vault", priority: 30, enabled: false },
  { name: "aws-secrets-manager", priority: 40, enabled: false },
  { name: "azure-key-vault", priority: 50, enabled: false },
  { name: "gcp-secret-manager", priority: 60, enabled: false },
  { name: "kubernetes", priority: 70, enabled: false },
];

const SECRET_KEY_PATTERNS: Record<SecretType, RegExp> = {
  [SecretType.DatabaseCredentials]: /^db_/,
  [SecretType.JwtSigningKey]: /^jwt_/,
  [SecretType.ApiKey]: /^api_/,
  [SecretType.SmtpCredentials]: /^smtp_/,
  [SecretType.StorageCredentials]: /^storage_/,
  [SecretType.WebhookSecret]: /^wh_/,
  [SecretType.EncryptionKey]: /^enc_/,
  [SecretType.OAuthClientSecret]: /^oauth_/,
};

export function getSecretKeyPattern(type: SecretType): RegExp {
  return SECRET_KEY_PATTERNS[type];
}
