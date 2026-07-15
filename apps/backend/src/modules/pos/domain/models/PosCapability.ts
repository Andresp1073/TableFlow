export enum PosCapability {
  Orders = "orders",
  Menus = "menus",
  Tables = "tables",
  Employees = "employees",
  Customers = "customers",
  Receipts = "receipts",
  Payments = "payments",
  Inventory = "inventory",
}

export const POS_CAPABILITIES: readonly PosCapability[] = Object.values(PosCapability);

export const POS_PREPARE_ONLY_CAPABILITIES: readonly PosCapability[] = [
  PosCapability.Payments,
  PosCapability.Inventory,
];

export function isCapabilitySupported(
  providerCapabilities: readonly PosCapability[],
  required: PosCapability,
): boolean {
  return providerCapabilities.includes(required);
}

export function areCapabilitiesSupported(
  providerCapabilities: readonly PosCapability[],
  required: readonly PosCapability[],
): boolean {
  return required.every((c) => providerCapabilities.includes(c));
}
