import type {
  SecretMetadata,
  SecretRotationPolicyConfig,
  RotationStatus,
} from "./types.js";

export function createDefaultRotationPolicy(overrides?: Partial<SecretRotationPolicyConfig>): SecretRotationPolicyConfig {
  return {
    maxAgeMs: overrides?.maxAgeMs ?? 90 * 24 * 60 * 60 * 1000,
    rotateBeforeExpiryMs: overrides?.rotateBeforeExpiryMs ?? 7 * 24 * 60 * 60 * 1000,
    versionsToKeep: overrides?.versionsToKeep ?? 2,
    autoRotate: overrides?.autoRotate ?? false,
    notifyOnRotation: overrides?.notifyOnRotation ?? true,
    allowedRotationWindow: overrides?.allowedRotationWindow,
    requireApproval: overrides?.requireApproval ?? false,
  };
}

export function computeRotationStatus(
  secretKey: string,
  metadata: SecretMetadata,
  policy: SecretRotationPolicyConfig,
): RotationStatus {
  const now = Date.now();
  const expiresAt = metadata.expiresAt ? new Date(metadata.expiresAt) : null;
  const lastRotatedAt = metadata.lastRotatedAt ? new Date(metadata.lastRotatedAt) : null;

  let status: RotationStatus["status"] = "ok";
  let daysUntilExpiry: number | null = null;

  if (expiresAt) {
    const diffMs = expiresAt.getTime() - now;
    daysUntilExpiry = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

    if (diffMs <= 0) {
      status = "expired";
    } else if (diffMs <= policy.rotateBeforeExpiryMs) {
      status = "expiring_soon";
    } else if (diffMs <= policy.rotateBeforeExpiryMs * 2) {
      status = "rotation_required";
    }
  }

  const activeVersion = metadata.versions.find((v) => v.status === "active");
  if (activeVersion && !expiresAt) {
    const versionAge = now - activeVersion.createdAt.getTime();

    if (versionAge > policy.maxAgeMs) {
      status = "rotation_required";
    }
  }

  return {
    secretKey,
    currentVersion: metadata.currentVersion,
    expiresAt,
    lastRotatedAt,
    status,
    daysUntilExpiry,
    policy,
  };
}

export function shouldRotate(status: RotationStatus): boolean {
  return (
    status.status === "expired" ||
    status.status === "expiring_soon" ||
    status.status === "rotation_required" ||
    status.status === "compromised"
  );
}

export function isRotationAllowed(status: RotationStatus): boolean {
  if (!status.policy.autoRotate && status.status !== "compromised") {
    return false;
  }

  if (status.policy.allowedRotationWindow) {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    if (
      currentTime < status.policy.allowedRotationWindow.start ||
      currentTime > status.policy.allowedRotationWindow.end
    ) {
      return false;
    }
  }

  return true;
}

export function requiresApproval(status: RotationStatus): boolean {
  return status.policy.requireApproval === true && status.status !== "compromised";
}
