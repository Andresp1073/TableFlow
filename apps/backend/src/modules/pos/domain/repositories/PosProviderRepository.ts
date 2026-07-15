import type { PosProvider } from "../models/PosProvider.js";

export interface PosProviderRepository {
  findById(id: string): Promise<PosProvider | null>;
  findByName(name: string): Promise<PosProvider | null>;
  findAll(): Promise<PosProvider[]>;
  findEnabled(): Promise<PosProvider[]>;
  findByCapability(capability: string): Promise<PosProvider[]>;
  save(provider: PosProvider): Promise<void>;
  delete(id: string): Promise<void>;
}
