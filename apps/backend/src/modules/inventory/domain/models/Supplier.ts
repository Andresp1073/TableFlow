export enum SupplierStatus {
  Active = "active",
  Inactive = "inactive",
  Suspended = "suspended",
}

export interface SupplierConfig {
  id: string;
  restaurantId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: SupplierStatus;
  leadTimeDays: number;
  minimumOrderAmount: number;
  preferred: boolean;
  paymentTerms?: string;
  notes?: string;
}

export class Supplier {
  private constructor(public readonly value: SupplierConfig) {}

  static create(config: SupplierConfig): Supplier {
    if (!config.id.trim()) throw new Error("Supplier ID cannot be empty");
    if (!config.name.trim()) throw new Error("Supplier name cannot be empty");
    if (config.leadTimeDays < 0) throw new Error("Lead time cannot be negative");
    return new Supplier({ ...config });
  }

  static reconstitute(config: SupplierConfig): Supplier {
    return new Supplier(config);
  }

  get id(): string { return this.value.id; }
  get restaurantId(): string { return this.value.restaurantId; }
  get name(): string { return this.value.name; }
  get contactName(): string | undefined { return this.value.contactName; }
  get email(): string | undefined { return this.value.email; }
  get phone(): string | undefined { return this.value.phone; }
  get address(): string | undefined { return this.value.address; }
  get status(): SupplierStatus { return this.value.status; }
  get leadTimeDays(): number { return this.value.leadTimeDays; }
  get minimumOrderAmount(): number { return this.value.minimumOrderAmount; }
  get preferred(): boolean { return this.value.preferred; }
  get paymentTerms(): string | undefined { return this.value.paymentTerms; }
  get notes(): string | undefined { return this.value.notes; }

  equals(other: Supplier): boolean { return this.value.id === other.value.id; }

  isAvailable(): boolean { return this.value.status === SupplierStatus.Active; }

  markPreferred(): Supplier { return Supplier.reconstitute({ ...this.value, preferred: true }); }
  unmarkPreferred(): Supplier { return Supplier.reconstitute({ ...this.value, preferred: false }); }
  suspend(): Supplier { return Supplier.reconstitute({ ...this.value, status: SupplierStatus.Suspended }); }
  activate(): Supplier { return Supplier.reconstitute({ ...this.value, status: SupplierStatus.Active }); }
}
