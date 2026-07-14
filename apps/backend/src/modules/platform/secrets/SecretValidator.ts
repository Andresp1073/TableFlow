import type {
  SecretMetadata,
  SecretPayload,
  SecretType,
  SecretValidationResult,
  SecretValidationError,
  SecretValidationWarning,
  SecretValidationErrorCode,
} from "./types.js";
import { getSecretKeyPattern } from "./types.js";

export class SecretValidator {
  validate(metadata: SecretMetadata, value: SecretPayload): SecretValidationResult {
    const errors: SecretValidationError[] = [];
    const warnings: SecretValidationWarning[] = [];

    this.validateRequiredFields(metadata, value, errors);
    this.validateFormatInternal(metadata, value, errors);
    this.validateExpirationInternal(metadata, errors, warnings);
    this.validateVersionInternal(metadata, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  validateRequired(metadata: SecretMetadata, value: SecretPayload): SecretValidationError[] {
    const errors: SecretValidationError[] = [];

    this.validateRequiredFields(metadata, value, errors);

    return errors;
  }

  validateFormat(metadata: SecretMetadata, value: SecretPayload): SecretValidationError[] {
    const errors: SecretValidationError[] = [];

    this.validateFormatInternal(metadata, value, errors);

    return errors;
  }

  validateExpiration(metadata: SecretMetadata): { errors: SecretValidationError[]; warnings: SecretValidationWarning[] } {
    const errors: SecretValidationError[] = [];
    const warnings: SecretValidationWarning[] = [];

    this.validateExpirationInternal(metadata, errors, warnings);

    return { errors, warnings };
  }

  validateVersion(metadata: SecretMetadata): { errors: SecretValidationError[]; warnings: SecretValidationWarning[] } {
    const errors: SecretValidationError[] = [];
    const warnings: SecretValidationWarning[] = [];

    this.validateVersionInternal(metadata, errors, warnings);

    return { errors, warnings };
  }

  private validateRequiredFields(
    metadata: SecretMetadata,
    value: SecretPayload,
    errors: SecretValidationError[],
  ): void {
    if (!value) {
      errors.push({
        field: metadata.key,
        message: `Secret value is null or undefined`,
        code: "missing_required",
      });
      return;
    }

    switch (metadata.type) {
      case "database_credentials": {
        const db = value as import("./types.js").DatabaseCredentials;
        if (!db.host) { errors.push({ field: "host", message: "Database host is required", code: "missing_required" }); }
        if (!db.port) { errors.push({ field: "port", message: "Database port is required", code: "missing_required" }); }
        if (!db.username) { errors.push({ field: "username", message: "Database username is required", code: "missing_required" }); }
        if (!db.password) { errors.push({ field: "password", message: "Database password is required", code: "missing_required" }); }
        if (!db.database) { errors.push({ field: "database", message: "Database name is required", code: "missing_required" }); }
        break;
      }
      case "jwt_signing_key": {
        const jwt = value as import("./types.js").JwtSigningKeyValue;
        if (!jwt.key) { errors.push({ field: "key", message: "JWT signing key is required", code: "missing_required" }); }
        if (!jwt.algorithm) { errors.push({ field: "algorithm", message: "JWT algorithm is required", code: "missing_required" }); }
        break;
      }
      case "api_key": {
        const api = value as import("./types.js").ApiKeyValue;
        if (!api.key) { errors.push({ field: "key", message: "API key value is required", code: "missing_required" }); }
        break;
      }
      case "smtp_credentials": {
        const smtp = value as import("./types.js").SmtpCredentials;
        if (!smtp.host) { errors.push({ field: "host", message: "SMTP host is required", code: "missing_required" }); }
        if (!smtp.port) { errors.push({ field: "port", message: "SMTP port is required", code: "missing_required" }); }
        if (!smtp.username) { errors.push({ field: "username", message: "SMTP username is required", code: "missing_required" }); }
        if (!smtp.password) { errors.push({ field: "password", message: "SMTP password is required", code: "missing_required" }); }
        break;
      }
      case "storage_credentials": {
        const storage = value as import("./types.js").StorageCredentials;
        if (!storage.accessKeyId) { errors.push({ field: "accessKeyId", message: "Storage access key ID is required", code: "missing_required" }); }
        if (!storage.secretAccessKey) { errors.push({ field: "secretAccessKey", message: "Storage secret access key is required", code: "missing_required" }); }
        break;
      }
      case "webhook_secret": {
        const wh = value as import("./types.js").WebhookSecretValue;
        if (!wh.secret) { errors.push({ field: "secret", message: "Webhook secret is required", code: "missing_required" }); }
        break;
      }
      case "encryption_key": {
        const enc = value as import("./types.js").EncryptionKeyValue;
        if (!enc.key) { errors.push({ field: "key", message: "Encryption key is required", code: "missing_required" }); }
        if (!enc.algorithm) { errors.push({ field: "algorithm", message: "Encryption algorithm is required", code: "missing_required" }); }
        break;
      }
      case "oauth_client_secret": {
        const oauth = value as import("./types.js").OAuthClientSecretValue;
        if (!oauth.clientId) { errors.push({ field: "clientId", message: "OAuth client ID is required", code: "missing_required" }); }
        if (!oauth.clientSecret) { errors.push({ field: "clientSecret", message: "OAuth client secret is required", code: "missing_required" }); }
        break;
      }
    }
  }

  private validateFormatInternal(
    metadata: SecretMetadata,
    value: SecretPayload,
    errors: SecretValidationError[],
  ): void {
    const keyPattern = getSecretKeyPattern(metadata.type);
    const keyMatch = metadata.key.match(/^[a-zA-Z][a-zA-Z0-9_.-]*$/);

    if (!keyMatch) {
      errors.push({
        field: "key",
        message: `Secret key "${metadata.key}" does not follow naming convention`,
        code: "invalid_format",
      });
    }

    if (metadata.type === "jwt_signing_key") {
      const jwt = value as import("./types.js").JwtSigningKeyValue;
      const supportedAlgorithms = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "ES256", "ES384", "ES512"];

      if (!supportedAlgorithms.includes(jwt.algorithm)) {
        errors.push({
          field: "algorithm",
          message: `Unsupported JWT algorithm "${jwt.algorithm}". Supported: ${supportedAlgorithms.join(", ")}`,
          code: "invalid_format",
        });
      }
    }

    if (metadata.type === "database_credentials") {
      const db = value as import("./types.js").DatabaseCredentials;

      if (db.port < 1 || db.port > 65535) {
        errors.push({
          field: "port",
          message: `Database port ${db.port} is out of valid range (1-65535)`,
          code: "invalid_format",
        });
      }
    }

    if (metadata.type === "smtp_credentials") {
      const smtp = value as import("./types.js").SmtpCredentials;

      if (smtp.port < 1 || smtp.port > 65535) {
        errors.push({
          field: "port",
          message: `SMTP port ${smtp.port} is out of valid range (1-65535)`,
          code: "invalid_format",
        });
      }
    }

    if (metadata.type === "encryption_key") {
      const enc = value as import("./types.js").EncryptionKeyValue;
      const supportedAlgorithms = ["AES-256-GCM", "AES-128-GCM", "AES-256-CBC", "AES-128-CBC", "ChaCha20-Poly1305"];

      if (!supportedAlgorithms.includes(enc.algorithm)) {
        errors.push({
          field: "algorithm",
          message: `Unsupported encryption algorithm "${enc.algorithm}"`,
          code: "invalid_format",
        });
      }
    }
  }

  private validateExpirationInternal(
    metadata: SecretMetadata,
    errors: SecretValidationError[],
    warnings: SecretValidationWarning[],
  ): void {
    if (!metadata.expiresAt) {
      return;
    }

    const now = new Date();
    const expiresAt = new Date(metadata.expiresAt);

    if (expiresAt <= now) {
      errors.push({
        field: "expiresAt",
        message: `Secret "${metadata.key}" expired at ${expiresAt.toISOString()}`,
        code: "expired_secret",
      });
      return;
    }

    const rotationPolicy = metadata.rotationPolicy;
    if (rotationPolicy) {
      const expiryThreshold = new Date(now.getTime() + rotationPolicy.rotateBeforeExpiryMs);

      if (expiresAt <= expiryThreshold) {
        warnings.push({
          field: "expiresAt",
          message: `Secret "${metadata.key}" is expiring soon at ${expiresAt.toISOString()}`,
          code: "expiring_soon",
        });
      }
    }
  }

  private validateVersionInternal(
    metadata: SecretMetadata,
    errors: SecretValidationError[],
    warnings: SecretValidationWarning[],
  ): void {
    if (metadata.versions.length === 0) {
      errors.push({
        field: "versions",
        message: `Secret "${metadata.key}" has no versions`,
        code: "version_outdated",
      });
      return;
    }

    const activeVersion = metadata.versions.find((v) => v.status === "active");

    if (!activeVersion) {
      errors.push({
        field: "versions",
        message: `Secret "${metadata.key}" has no active version`,
        code: "version_outdated",
      });
      return;
    }

    if (activeVersion.version !== metadata.currentVersion) {
      warnings.push({
        field: "currentVersion",
        message: `Active version (${activeVersion.version}) differs from current version (${metadata.currentVersion})`,
        code: "version_mismatch",
      });
    }

    const rotationPolicy = metadata.rotationPolicy;
    if (rotationPolicy && activeVersion.createdAt) {
      const maxAgeDate = new Date(activeVersion.createdAt.getTime() + rotationPolicy.maxAgeMs);

      if (new Date() > maxAgeDate) {
        warnings.push({
          field: "version",
          message: `Active version ${activeVersion.version} has exceeded maximum age`,
          code: "version_exceeded_max_age",
        });
      }
    }
  }
}
