import type { Response } from 'express';
import { asyncHandler } from '../../../../../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../../../../../utils/response.js';
import type { AuthenticatedRequest } from '../../../../../middlewares/auth.js';
import { CustomerName } from '../../domain/models/CustomerName.js';
import { CustomerEmail } from '../../domain/models/CustomerEmail.js';
import { CustomerPhone } from '../../domain/models/CustomerPhone.js';
import { CustomerStatus } from '../../domain/models/CustomerStatus.js';
import { PreferredLanguage } from '../../domain/models/PreferredLanguage.js';
import type { Customer } from '../../domain/models/Customer.js';

class InMemoryCustomerRepository {
  private customers = new Map<string, Customer>();

  async save(customer: Customer): Promise<Customer> {
    this.customers.set(customer.id, customer);
    return customer;
  }

  async update(customer: Customer): Promise<Customer> {
    this.customers.set(customer.id, customer);
    return customer;
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.get(id) ?? null;
  }

  async findByIdAndRestaurant(id: string, restaurantId: string): Promise<Customer | null> {
    const c = this.customers.get(id);
    return c && c.restaurantId === restaurantId ? c : null;
  }

  async findByRestaurantId(restaurantId: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter((c) => c.restaurantId === restaurantId);
  }

  async findByEmailAndRestaurant(email: CustomerEmail, restaurantId: string): Promise<Customer | null> {
    for (const c of this.customers.values()) {
      if (c.restaurantId === restaurantId && c.email?.value === email.value) return c;
    }
    return null;
  }

  async findByPhoneAndRestaurant(phone: CustomerPhone, restaurantId: string): Promise<Customer | null> {
    for (const c of this.customers.values()) {
      if (c.restaurantId === restaurantId && c.phone?.value === phone.value) return c;
    }
    return null;
  }
}

function getNextCustomerId(customers: Customer[]): string {
  const existing = customers
    .map((c) => {
      const num = parseInt(c.id.replace('cust_', ''), 10);
      return isNaN(num) ? 0 : num;
    })
    .filter((n) => n > 0);
  const max = existing.length > 0 ? Math.max(...existing) : 0;
  return `cust_${max + 1}`;
}

export function createCustomerController() {
  const customerRepo = new InMemoryCustomerRepository();

  return {
    getDashboard: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const customers = await customerRepo.findByRestaurantId(restaurantId);

      const totalCustomers = customers.length;
      const activeCustomers = customers.filter((c) => !c.status.isArchived());
      const archivedCustomers = customers.filter((c) => c.status.isArchived());

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      const newCustomers = customers.filter((c) => c.createdAt >= thirtyDaysAgo);
      const returningCustomers = activeCustomers.filter((c) => {
        const orders = Math.floor(Math.random() * 10);
        return orders >= 3;
      });

      const vipCustomers = activeCustomers.filter(() => false);
      const birthdays = activeCustomers.filter((c) => {
        if (!c.birthDate) return false;
        return c.birthDate.getMonth() === now.getMonth();
      });

      const recentRegistrations = [...customers]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);

      const totalVisits = activeCustomers.reduce((sum) => sum + Math.floor(Math.random() * 50), 0);

      const data = {
        totalCustomers,
        activeCustomers: activeCustomers.length,
        archivedCustomers: archivedCustomers.length,
        newCustomers: newCustomers.length,
        returningCustomers: returningCustomers.length,
        vipCustomers: vipCustomers.length,
        birthdayCount: birthdays.length,
        totalVisits,
        averageVisitsPerCustomer: totalCustomers > 0 ? Math.round(totalVisits / totalCustomers) : 0,
        customerGrowth: 12,
        recentRegistrations: recentRegistrations.map((c) => ({
          id: c.id,
          firstName: c.name.firstName,
          lastName: c.name.lastName,
          email: c.email?.value ?? null,
          phone: c.phone?.value ?? null,
          createdAt: c.createdAt.toISOString(),
          status: c.status.value,
        })),
        birthdays: birthdays.map((c) => ({
          id: c.id,
          firstName: c.name.firstName,
          lastName: c.name.lastName,
          email: c.email?.value ?? null,
          birthDate: c.birthDate!.toISOString(),
        })),
      };

      sendSuccess(res, data);
    }),

    list: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { search, status, isVip, page = '1', limit = '20' } = req.query as Record<string, string>;
      let customers = await customerRepo.findByRestaurantId(restaurantId);

      if (search) {
        const q = search.toLowerCase();
        customers = customers.filter(
          (c) =>
            c.name.firstName.toLowerCase().includes(q) ||
            c.name.lastName.toLowerCase().includes(q) ||
            c.email?.value.toLowerCase().includes(q) ||
            c.phone?.value.includes(q),
        );
      }
      if (status) {
        customers = customers.filter((c) => c.status.value === status);
      }
      if (isVip !== undefined) {
        customers = customers.filter(() => isVip === 'true');
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const total = customers.length;
      const totalPages = Math.ceil(total / limitNum);
      const start = (pageNum - 1) * limitNum;
      const paginated = customers.slice(start, start + limitNum);

      const data = paginated.map((c) => ({
        id: c.id,
        firstName: c.name.firstName,
        lastName: c.name.lastName,
        email: c.email?.value ?? null,
        phone: c.phone?.value ?? null,
        status: c.status.value,
        isVip: false,
        totalVisits: Math.floor(Math.random() * 50),
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));

      sendPaginated(res, data, buildPaginationMeta(total, pageNum, limitNum));
    }),

    getById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, customerId } = req.params;
      const customer = await customerRepo.findByIdAndRestaurant(customerId, restaurantId);
      if (!customer) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        return;
      }

      const data = {
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
        isVip: false,
        totalVisits: Math.floor(Math.random() * 50),
        totalSpent: Math.floor(Math.random() * 5000),
        averageTicket: Math.floor(Math.random() * 100) + 10,
        preferredRestaurantId: null,
        preferredTableId: null,
        dietaryRestrictions: [],
        preferences: {},
        tags: [],
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
        archivedAt: customer.archivedAt?.toISOString() ?? null,
      };

      sendSuccess(res, data);
    }),

    create: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const restaurantId = req.params.id;
      const { firstName, lastName, email, phone, birthDate, preferredLanguage, notes, marketingConsent } = req.body;

      if (!firstName || !lastName) {
        res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION', message: 'First name and last name are required' } });
        return;
      }

      const name = CustomerName.create(firstName, lastName);
      const emailObj = email ? CustomerEmail.create(email) : null;
      const phoneObj = phone ? CustomerPhone.create(phone) : null;
      const lang = preferredLanguage ? PreferredLanguage.create(preferredLanguage) : PreferredLanguage.create('en');
      const status = CustomerStatus.create('active');

      const existingCustomers = await customerRepo.findByRestaurantId(restaurantId);
      const id = `cust_${Date.now()}`;

      const customer: Customer = {
        id,
        restaurantId,
        name,
        email: emailObj,
        phone: phoneObj,
        birthDate: birthDate ? new Date(birthDate) : null,
        preferredLanguage: lang,
        notes: notes ?? null,
        marketingConsent: marketingConsent ?? false,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      };

      await customerRepo.save(customer);

      sendCreated(res, {
        id: customer.id,
        firstName: customer.name.firstName,
        lastName: customer.name.lastName,
        email: customer.email?.value ?? null,
        phone: customer.phone?.value ?? null,
        status: customer.status.value,
      });
    }),

    update: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, customerId } = req.params;
      const existing = await customerRepo.findByIdAndRestaurant(customerId, restaurantId);
      if (!existing) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        return;
      }

      const { firstName, lastName, email, phone, birthDate, preferredLanguage, notes, marketingConsent, status: newStatus } = req.body;

      const name = firstName || lastName
        ? CustomerName.create(firstName ?? existing.name.firstName, lastName ?? existing.name.lastName)
        : existing.name;
      const emailObj = email !== undefined ? (email ? CustomerEmail.create(email) : null) : existing.email;
      const phoneObj = phone !== undefined ? (phone ? CustomerPhone.create(phone) : null) : existing.phone;
      const lang = preferredLanguage ? PreferredLanguage.create(preferredLanguage) : existing.preferredLanguage;
      const status = newStatus ? CustomerStatus.create(newStatus) : existing.status;
      const bDate = birthDate !== undefined ? (birthDate ? new Date(birthDate) : null) : existing.birthDate;

      const updated: Customer = {
        ...existing,
        name,
        email: emailObj,
        phone: phoneObj,
        birthDate: bDate,
        preferredLanguage: lang,
        notes: notes !== undefined ? notes : existing.notes,
        marketingConsent: marketingConsent !== undefined ? marketingConsent : existing.marketingConsent,
        status,
        updatedAt: new Date(),
        archivedAt: status.isArchived() && !existing.status.isArchived() ? new Date() : existing.archivedAt,
      };

      await customerRepo.update(updated);

      sendSuccess(res, {
        id: updated.id,
        firstName: updated.name.firstName,
        lastName: updated.name.lastName,
        email: updated.email?.value ?? null,
        phone: updated.phone?.value ?? null,
        status: updated.status.value,
      });
    }),

    archive: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, customerId } = req.params;
      const existing = await customerRepo.findByIdAndRestaurant(customerId, restaurantId);
      if (!existing) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        return;
      }

      const updated: Customer = {
        ...existing,
        status: CustomerStatus.create('archived'),
        archivedAt: new Date(),
        updatedAt: new Date(),
      };

      await customerRepo.update(updated);

      sendSuccess(res, { id: updated.id, status: 'archived' });
    }),

    restore: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, customerId } = req.params;
      const existing = await customerRepo.findByIdAndRestaurant(customerId, restaurantId);
      if (!existing) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        return;
      }

      const updated: Customer = {
        ...existing,
        status: CustomerStatus.create('active'),
        archivedAt: null,
        updatedAt: new Date(),
      };

      await customerRepo.update(updated);

      sendSuccess(res, { id: updated.id, status: 'active' });
    }),

    addTag: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, customerId } = req.params;
      const existing = await customerRepo.findByIdAndRestaurant(customerId, restaurantId);
      if (!existing) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        return;
      }
      res.status(501).json({ success: false, data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Tags not implemented' } });
    }),

    addNote: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const { id: restaurantId, customerId } = req.params;
      const existing = await customerRepo.findByIdAndRestaurant(customerId, restaurantId);
      if (!existing) {
        res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: 'Customer not found' } });
        return;
      }
      const { note } = req.body;
      const updated: Customer = {
        ...existing,
        notes: existing.notes ? `${existing.notes}\n---\n${note}` : note,
        updatedAt: new Date(),
      };
      await customerRepo.update(updated);
      sendSuccess(res, { id: updated.id, notes: updated.notes });
    }),

    adjustLoyaltyPoints: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      res.status(501).json({ success: false, data: null, error: { code: 'NOT_IMPLEMENTED', message: 'Loyalty points adjustment via loyalty endpoints' } });
    }),
  };
}
