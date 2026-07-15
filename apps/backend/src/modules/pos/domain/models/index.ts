export { PosProvider } from "./PosProvider.js";
export type { PosProviderConfig } from "./PosProvider.js";

export { PosConnection, PosConnectionStatus } from "./PosConnection.js";
export type { PosConnectionConfig } from "./PosConnection.js";

export {
  PosCapability,
  POS_CAPABILITIES,
  POS_PREPARE_ONLY_CAPABILITIES,
  isCapabilitySupported,
  areCapabilitiesSupported,
} from "./PosCapability.js";

export { PosContext, PosEnvironment } from "./PosContext.js";
export type { PosContextConfig } from "./PosContext.js";

export {
  PosSynchronizationPolicy,
  SynchronizationDirection,
  SynchronizationTrigger,
  ConflictResolutionStrategy,
} from "./PosSynchronizationPolicy.js";
export type { PosSynchronizationPolicyConfig } from "./PosSynchronizationPolicy.js";
