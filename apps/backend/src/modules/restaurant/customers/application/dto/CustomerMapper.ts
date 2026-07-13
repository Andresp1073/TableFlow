import type { Customer } from "../../domain/models/Customer.js";
import type { CustomerDTO } from "./CustomerDTO.js";
import type { CustomerSummary } from "./CustomerSummary.js";

export class CustomerMapper {
  static toDTO(customer: Customer): CustomerDTO {
    return {
      id: customer.id,
      restaurantId: customer.restaurantId,
      firstName: customer.name.firstName,
      lastName: customer.name.lastName,
      email: customer.email?.value ?? null,
      phone: customer.phone?.value ?? null,
      birthDate: customer.birthDate?.toISOString() ?? null,
      preferredLanguage: customer.preferredLanguage.value,
      notes: customer.notes,
      marketingConsent: customer.marketingConsent,
      status: customer.status.value,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      archivedAt: customer.archivedAt?.toISOString() ?? null,
    };
  }

  static toSummary(customer: Customer): CustomerSummary {
    return {
      id: customer.id,
      restaurantId: customer.restaurantId,
      firstName: customer.name.firstName,
      lastName: customer.name.lastName,
      email: customer.email?.value ?? null,
      phone: customer.phone?.value ?? null,
      status: customer.status.value,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }

  static toDTOList(customers: Customer[]): CustomerDTO[] {
    return customers.map(CustomerMapper.toDTO);
  }

  static toSummaryList(customers: Customer[]): CustomerSummary[] {
    return customers.map(CustomerMapper.toSummary);
  }
}
