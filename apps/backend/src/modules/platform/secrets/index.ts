export type {
  SecretProvider,
  SecretManagerInterface,
  SecretSource,
  SecretSourceConfig,
  Secret,
  SecretMetadata,
  SecretVersion,
  SecretVersionStatus,
  SecretPayload,
  SecretType as SecretTypeEnum,
  DatabaseCredentials,
  JwtSigningKeyValue,
  ApiKeyValue,
  SmtpCredentials,
  StorageCredentials,
  WebhookSecretValue,
  EncryptionKeyValue,
  OAuthClientSecretValue,
  SecretRotationPolicyConfig,
  RotationStatus,
  SecretValidationResult,
  SecretValidationError,
  SecretValidationWarning,
  SecretValidationErrorCode,
  SecretEventType,
  SecretEvent,
  SecretCacheConfig,
} from "./types.js";

export { SecretType } from "./types.js";
export { getSecretKeyPattern } from "./types.js";
export { SecretValidator } from "./SecretValidator.js";
export { SecretCache } from "./SecretCache.js";
export { SecretResolver } from "./SecretResolver.js";
export { SecretManager } from "./SecretManager.js";
export {
  createDefaultRotationPolicy,
  computeRotationStatus,
  shouldRotate,
  isRotationAllowed,
  requiresApproval,
} from "./SecretRotationPolicy.js";
export { EnvironmentSource, ConfigurationSource } from "./sources/index.js";
export {
  SecretError,
  SecretNotFoundError,
  SecretExpiredError,
  SecretValidationFailedError,
  SecretRotationFailedError,
} from "./errors.js";
