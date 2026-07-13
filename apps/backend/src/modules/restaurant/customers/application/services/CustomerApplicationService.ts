import type { CustomerRepository } from "../../domain/repositories/CustomerRepository.js";
import type { CustomerFactory } from "../../domain/repositories/CustomerFactory.js";
import type { AuthorizationService } from "../../../authorization/application/services/AuthorizationService.js";
import type { AuthorizationContext } from "../../../authorization/domain/models/AuthorizationContext.js";
import type { AuditService } from "../../../audit/application/services/AuditService.js";
import type { CustomerCacheInvalidator } from "./CustomerCacheInvalidator.js";
import { EventBus } from "../../../../events/EventBus.js";
import { CustomerName } from "../../domain/models/CustomerName.js";
import { CustomerEmail } from "../../domain/models/CustomerEmail.js";
import { CustomerPhone } from "../../domain/models/CustomerPhone.js";
import { CustomerStatus } from "../../domain/models/CustomerStatus.js";
import { PreferredLanguage } from "../../domain/models/PreferredLanguage.js";
import { CustomerValidationPolicy } from "../../domain/services/CustomerValidationPolicy.js";
import { CustomerDuplicatePolicy } from "../../domain/services/CustomerDuplicatePolicy.js";
import {
  CustomerCreated,
  CustomerUpdated,
  CustomerArchived,
} from "../../domain/events/CustomerEvents.js";
import { CustomerMapper } from "../dto/CustomerMapper.js";
import type { CustomerDTO } from "../dto/CustomerDTO.js";
import type { CustomerSummary } from "../dto/CustomerSummary.js";
import type { CreateCustomerCommand } from "../commands/CreateCustomerCommand.js";
import type { UpdateCustomerCommand } from "../commands/UpdateCustomerCommand.js";
import type { ArchiveCustomerCommand } from "../commands/ArchiveCustomerCommand.js";
import type { GetCustomerQuery } from "../queries/GetCustomerQuery.js";
import type { ListCustomersQuery } from "../queries/ListCustomersQuery.js";
import type { FindCustomerByEmailQuery } from "../queries/FindCustomerByEmailQuery.js";
import { CustomerNotFoundError } from "../../errors/CustomerNotFoundError.js";
import { CustomerValidationError } from "../../errors/CustomerValidationError.js";

type CustomerPermission =
  | "restaurants.customers.create"
  | "restaurants.customers.read"
  | "restaurants.customers.update"
  | "restaurants.customers.archive";

export interface ApplicationMetadata {
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class CustomerApplicationService {
  private readonly validationPolicy = new CustomerValidationPolicy();

  constructor(
    private readonly repository: CustomerRepository,
    private readonly factory: CustomerFactory,
    private readonly duplicatePolicy: CustomerDuplicatePolicy,
    private readonly authService: AuthorizationService,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService,
    private readonly cacheInvalidator?: CustomerCacheInvalidator,
  ) {}

  private async authorize(auth: AuthorizationContext, permission: CustomerPermission): Promise<void> {
    await this.authService.authorize(auth, permission);
  }

  async create(
    command: CreateCustomerCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<CustomerDTO> {
    await this.authorize(auth, "restaurants.customers.create");

    const name = CustomerName.create(command.firstName, command.lastName);
    const email = command.email !== undefined && command.email !== null
      ? CustomerEmail.create(command.email)
      : null;
    const phone = command.phone !== undefined && command.phone !== null
      ? CustomerPhone.create(command.phone)
      : null;
    const birthDate = command.birthDate ? new Date(command.birthDate) : null;
    const preferredLanguage = command.preferredLanguage
      ? PreferredLanguage.create(command.preferredLanguage)
      : PreferredLanguage.create("en");
    const status = CustomerStatus.create("active");

    this.validationPolicy.validateContactMethod({ email, phone });

    if (email) {
      await this.duplicatePolicy.checkEmail(email, command.restaurantId);
    }
    if (phone) {
      await this.duplicatePolicy.checkPhone(phone, command.restaurantId);
    }

    const customer = this.factory.create({
      restaurantId: command.restaurantId,
      name,
      email: email ?? null,
      phone: phone ?? null,
      birthDate,
      preferredLanguage,
      notes: command.notes ?? null,
      marketingConsent: command.marketingConsent ?? false,
      createdBy: auth.userId,
    });

    const saved = await this.repository.save(customer);

    await this.eventBus.emit(
      "CustomerCreated",
      new CustomerCreated(
        saved.id,
        saved.restaurantId,
        saved.name.firstName,
        saved.name.lastName,
        saved.email?.value ?? null,
        saved.phone?.value ?? null,
      ),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "customer",
      entityId: saved.id,
      action: "create",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      newValues: {
        firstName: saved.name.firstName,
        lastName: saved.name.lastName,
        email: saved.email?.value ?? null,
        phone: saved.phone?.value ?? null,
      },
    });

    await this.cacheInvalidator?.invalidateOnCreate(command.restaurantId);

    return CustomerMapper.toDTO(saved);
  }

  async update(
    command: UpdateCustomerCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<CustomerDTO> {
    await this.authorize(auth, "restaurants.customers.update");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new CustomerNotFoundError(command.id);
    }

    if (existing.status.isArchived()) {
      throw new CustomerValidationError("Cannot update an archived customer");
    }

    const name = command.firstName !== undefined || command.lastName !== undefined
      ? CustomerName.create(
          command.firstName ?? existing.name.firstName,
          command.lastName ?? existing.name.lastName,
        )
      : existing.name;

    const email = command.email !== undefined
      ? (command.email !== null ? CustomerEmail.create(command.email) : null)
      : existing.email;

    const phone = command.phone !== undefined
      ? (command.phone !== null ? CustomerPhone.create(command.phone) : null)
      : existing.phone;

    const birthDate = command.birthDate !== undefined
      ? (command.birthDate !== null ? new Date(command.birthDate) : null)
      : existing.birthDate;

    const preferredLanguage = command.preferredLanguage !== undefined
      ? PreferredLanguage.create(command.preferredLanguage)
      : existing.preferredLanguage;

    let status = existing.status;
    if (command.status !== undefined) {
      if (!existing.status.isTransitionValid(command.status)) {
        throw new CustomerValidationError(
          `Cannot transition from "${existing.status.value}" to "${command.status}"`,
        );
      }
      status = CustomerStatus.create(command.status);
    }

    const notes = command.notes !== undefined ? command.notes : existing.notes;
    const marketingConsent = command.marketingConsent !== undefined
      ? command.marketingConsent
      : existing.marketingConsent;

    this.validationPolicy.validateContactMethod({ email, phone });

    if (email && (!existing.email || !email.equals(existing.email))) {
      await this.duplicatePolicy.checkEmail(email, command.restaurantId);
    }
    if (phone && (!existing.phone || !phone.equals(existing.phone))) {
      await this.duplicatePolicy.checkPhone(phone, command.restaurantId);
    }

    const updated: typeof existing = {
      ...existing,
      name,
      email,
      phone,
      birthDate,
      preferredLanguage,
      notes,
      marketingConsent,
      status,
      updatedAt: new Date(),
      archivedAt: status.isArchived() && !existing.status.isArchived() ? new Date() : existing.archivedAt,
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "CustomerUpdated",
      new CustomerUpdated(saved.id, saved.restaurantId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "customer",
      entityId: saved.id,
      action: "update",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues: {
        firstName: existing.name.firstName,
        lastName: existing.name.lastName,
        email: existing.email?.value ?? null,
        phone: existing.phone?.value ?? null,
        status: existing.status.value,
      },
      newValues: {
        firstName: saved.name.firstName,
        lastName: saved.name.lastName,
        email: saved.email?.value ?? null,
        phone: saved.phone?.value ?? null,
        status: saved.status.value,
      },
    });

    await this.cacheInvalidator?.invalidateOnUpdate(command.id, command.restaurantId);

    if (status.isArchived()) {
      await this.eventBus.emit(
        "CustomerArchived",
        new CustomerArchived(saved.id, saved.restaurantId),
      );

      await this.auditService.record({
        organizationId: auth.organizationId,
        module: "restaurant",
        entityType: "customer",
        entityId: saved.id,
        action: "archive",
        performedBy: auth.userId,
        restaurantId: command.restaurantId,
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
        requestId: metadata?.requestId ?? null,
        newValues: { archivedAt: saved.archivedAt?.toISOString() ?? null },
      });

      await this.cacheInvalidator?.invalidateOnArchive(command.id, command.restaurantId);
    }

    return CustomerMapper.toDTO(saved);
  }

  async archive(
    command: ArchiveCustomerCommand,
    auth: AuthorizationContext,
    metadata?: ApplicationMetadata,
  ): Promise<CustomerDTO> {
    await this.authorize(auth, "restaurants.customers.archive");

    const existing = await this.repository.findByIdAndRestaurant(command.id, command.restaurantId);
    if (!existing) {
      throw new CustomerNotFoundError(command.id);
    }

    if (!existing.status.isTransitionValid("archived")) {
      throw new CustomerValidationError(
        `Cannot archive customer from status "${existing.status.value}"`,
      );
    }

    const updated: typeof existing = {
      ...existing,
      status: CustomerStatus.create("archived"),
      archivedAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.repository.update(updated);

    await this.eventBus.emit(
      "CustomerArchived",
      new CustomerArchived(saved.id, saved.restaurantId),
    );

    await this.auditService.record({
      organizationId: auth.organizationId,
      module: "restaurant",
      entityType: "customer",
      entityId: saved.id,
      action: "archive",
      performedBy: auth.userId,
      restaurantId: command.restaurantId,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      requestId: metadata?.requestId ?? null,
      oldValues: { status: existing.status.value, archivedAt: null },
      newValues: { status: "archived", archivedAt: saved.archivedAt?.toISOString() ?? null },
    });

    await this.cacheInvalidator?.invalidateOnArchive(command.id, command.restaurantId);

    return CustomerMapper.toDTO(saved);
  }

  async getById(
    query: GetCustomerQuery,
    auth: AuthorizationContext,
  ): Promise<CustomerDTO> {
    await this.authorize(auth, "restaurants.customers.read");

    const customer = await this.repository.findByIdAndRestaurant(query.id, query.restaurantId);
    if (!customer) {
      throw new CustomerNotFoundError(query.id);
    }

    return CustomerMapper.toDTO(customer);
  }

  async list(
    query: ListCustomersQuery,
    auth: AuthorizationContext,
  ): Promise<CustomerSummary[]> {
    await this.authorize(auth, "restaurants.customers.read");

    const customers = await this.repository.findByRestaurantId(query.restaurantId);

    let filtered = customers;
    if (query.status) {
      filtered = filtered.filter((c) => c.status.value === query.status);
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.firstName.toLowerCase().includes(term) ||
          c.name.lastName.toLowerCase().includes(term) ||
          c.email?.value.toLowerCase().includes(term) ||
          c.phone?.value.includes(term),
      );
    }

    return CustomerMapper.toSummaryList(filtered);
  }

  async findByEmail(
    query: FindCustomerByEmailQuery,
    auth: AuthorizationContext,
  ): Promise<CustomerDTO | null> {
    await this.authorize(auth, "restaurants.customers.read");

    const email = CustomerEmail.create(query.email);
    const customer = await this.repository.findByEmailAndRestaurant(email, query.restaurantId);
    if (!customer) {
      return null;
    }

    return CustomerMapper.toDTO(customer);
  }
}
