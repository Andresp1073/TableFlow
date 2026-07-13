import { describe, it, expect, vi, beforeEach } from "vitest";
import { CustomerMapper } from "../application/dto/CustomerMapper.js";
import { CustomerValidator } from "../application/validators/CustomerValidator.js";
import { CustomerApplicationService } from "../application/services/CustomerApplicationService.js";
import { CustomerName } from "../domain/models/CustomerName.js";
import { CustomerEmail } from "../domain/models/CustomerEmail.js";
import { CustomerPhone } from "../domain/models/CustomerPhone.js";
import { CustomerStatus } from "../domain/models/CustomerStatus.js";
import { PreferredLanguage } from "../domain/models/PreferredLanguage.js";
import { CustomerValidationError } from "../errors/CustomerValidationError.js";
import { CustomerNotFoundError } from "../errors/CustomerNotFoundError.js";
import { DuplicateCustomerError } from "../errors/DuplicateCustomerError.js";
import type { Customer } from "../domain/models/Customer.js";

function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "cust-1",
    restaurantId: "rest-1",
    name: CustomerName.create("John", "Doe"),
    email: CustomerEmail.create("john@example.com"),
    phone: null,
    birthDate: null,
    preferredLanguage: PreferredLanguage.create("en"),
    notes: null,
    marketingConsent: false,
    status: CustomerStatus.create("active"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    archivedAt: null,
    ...overrides,
  };
}

describe("CustomerMapper", () => {
  it("maps Customer to DTO", () => {
    const customer = createMockCustomer();
    const dto = CustomerMapper.toDTO(customer);

    expect(dto.id).toBe("cust-1");
    expect(dto.restaurantId).toBe("rest-1");
    expect(dto.firstName).toBe("John");
    expect(dto.lastName).toBe("Doe");
    expect(dto.email).toBe("john@example.com");
    expect(dto.phone).toBeNull();
    expect(dto.birthDate).toBeNull();
    expect(dto.preferredLanguage).toBe("en");
    expect(dto.notes).toBeNull();
    expect(dto.marketingConsent).toBe(false);
    expect(dto.status).toBe("active");
    expect(dto.archivedAt).toBeNull();
    expect(typeof dto.createdAt).toBe("string");
    expect(typeof dto.updatedAt).toBe("string");
  });

  it("maps Customer with all fields to DTO", () => {
    const customer = createMockCustomer({
      email: CustomerEmail.create("jane@test.com"),
      phone: CustomerPhone.create("+1234567890"),
      birthDate: new Date("1990-05-15"),
      notes: "VIP customer",
      marketingConsent: true,
      status: CustomerStatus.create("blocked"),
      archivedAt: new Date("2025-06-01"),
    });
    const dto = CustomerMapper.toDTO(customer);

    expect(dto.email).toBe("jane@test.com");
    expect(dto.phone).toBe("+1234567890");
    expect(dto.birthDate).toBe("1990-05-15T00:00:00.000Z");
    expect(dto.notes).toBe("VIP customer");
    expect(dto.marketingConsent).toBe(true);
    expect(dto.status).toBe("blocked");
    expect(dto.archivedAt).toBe("2025-06-01T00:00:00.000Z");
  });

  it("maps Customer to Summary", () => {
    const customer = createMockCustomer();
    const summary = CustomerMapper.toSummary(customer);

    expect(summary.id).toBe("cust-1");
    expect(summary.restaurantId).toBe("rest-1");
    expect(summary.firstName).toBe("John");
    expect(summary.lastName).toBe("Doe");
    expect(summary.email).toBe("john@example.com");
    expect(summary.phone).toBeNull();
    expect(summary.status).toBe("active");
    expect(summary.createdAt).toBeTypeOf("string");
    expect(summary.updatedAt).toBeTypeOf("string");
  });

  it("maps arrays with toDTOList", () => {
    const customers = [createMockCustomer({ id: "c1" }), createMockCustomer({ id: "c2" })];
    const dtos = CustomerMapper.toDTOList(customers);

    expect(dtos).toHaveLength(2);
    expect(dtos[0].id).toBe("c1");
    expect(dtos[1].id).toBe("c2");
  });

  it("maps arrays with toSummaryList", () => {
    const customers = [createMockCustomer({ id: "c1" }), createMockCustomer({ id: "c2" })];
    const summaries = CustomerMapper.toSummaryList(customers);

    expect(summaries).toHaveLength(2);
    expect(summaries[0].id).toBe("c1");
    expect(summaries[1].id).toBe("c2");
  });
});

describe("CustomerValidator", () => {
  const validator = new CustomerValidator();

  describe("validateCreateRequest", () => {
    it("passes valid request", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        }),
      ).not.toThrow();
    });

    it("throws for missing restaurantId", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "",
          firstName: "John",
          lastName: "Doe",
        }),
      ).toThrow(CustomerValidationError);
    });

    it("throws for missing firstName", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          firstName: "",
          lastName: "Doe",
        }),
      ).toThrow(CustomerValidationError);
    });

    it("throws for too long firstName", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          firstName: "a".repeat(101),
          lastName: "Doe",
        }),
      ).toThrow(CustomerValidationError);
    });

    it("throws for missing lastName", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          firstName: "John",
          lastName: "",
        }),
      ).toThrow(CustomerValidationError);
    });

    it("throws for too long lastName", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          firstName: "John",
          lastName: "a".repeat(101),
        }),
      ).toThrow(CustomerValidationError);
    });

    it("throws when neither email nor phone", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          firstName: "John",
          lastName: "Doe",
        }),
      ).toThrow(CustomerValidationError);
    });

    it("passes with phone only", () => {
      expect(() =>
        validator.validateCreateRequest({
          restaurantId: "rest-1",
          firstName: "John",
          lastName: "Doe",
          phone: "+1234567890",
        }),
      ).not.toThrow();
    });
  });

  describe("validateUpdateRequest", () => {
    it("passes empty update", () => {
      expect(() => validator.validateUpdateRequest({})).not.toThrow();
    });

    it("throws for empty firstName", () => {
      expect(() =>
        validator.validateUpdateRequest({ firstName: "" }),
      ).toThrow(CustomerValidationError);
    });

    it("throws for too long firstName", () => {
      expect(() =>
        validator.validateUpdateRequest({ firstName: "a".repeat(101) }),
      ).toThrow(CustomerValidationError);
    });

    it("throws for empty lastName", () => {
      expect(() =>
        validator.validateUpdateRequest({ lastName: "" }),
      ).toThrow(CustomerValidationError);
    });

    it("throws for too long lastName", () => {
      expect(() =>
        validator.validateUpdateRequest({ lastName: "a".repeat(101) }),
      ).toThrow(CustomerValidationError);
    });
  });
});

describe("CustomerApplicationService", () => {
  let service: CustomerApplicationService;
  let mockRepository: any;
  let mockFactory: any;
  let mockDuplicatePolicy: any;
  let mockAuthService: any;
  let mockEventBus: any;
  let mockAuditService: any;
  let mockCacheInvalidator: any;
  let mockAuth: any;

  const defaultCustomer = createMockCustomer();

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue(defaultCustomer),
      update: vi.fn().mockResolvedValue(defaultCustomer),
      findByIdAndRestaurant: vi.fn().mockResolvedValue(defaultCustomer),
      findByRestaurantId: vi.fn().mockResolvedValue([defaultCustomer]),
      findByEmailAndRestaurant: vi.fn().mockResolvedValue(defaultCustomer),
      findByPhoneAndRestaurant: vi.fn().mockResolvedValue(null),
    };

    mockFactory = {
      create: vi.fn().mockReturnValue(defaultCustomer),
      reconstitute: vi.fn().mockReturnValue(defaultCustomer),
    };

    mockDuplicatePolicy = {
      checkEmail: vi.fn().mockResolvedValue(undefined),
      checkPhone: vi.fn().mockResolvedValue(undefined),
      checkForCreation: vi.fn().mockResolvedValue({ hasDuplicates: false, duplicateFields: [] }),
    };

    mockAuthService = {
      authorize: vi.fn().mockResolvedValue(undefined),
    };

    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    };

    mockAuditService = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    mockCacheInvalidator = {
      invalidateOnCreate: vi.fn().mockResolvedValue(undefined),
      invalidateOnUpdate: vi.fn().mockResolvedValue(undefined),
      invalidateOnArchive: vi.fn().mockResolvedValue(undefined),
    };

    mockAuth = {
      userId: "user-1",
      organizationId: "org-1",
      restaurantIds: ["rest-1"],
      roles: ["admin"],
    };

    service = new CustomerApplicationService(
      mockRepository,
      mockFactory,
      mockDuplicatePolicy,
      mockAuthService,
      mockEventBus,
      mockAuditService,
      mockCacheInvalidator,
    );
  });

  describe("create", () => {
    it("creates a customer successfully", async () => {
      const result = await service.create(
        {
          restaurantId: "rest-1",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
        },
        mockAuth,
      );

      expect(result.id).toBe("cust-1");
      expect(result.firstName).toBe("John");
      expect(mockAuthService.authorize).toHaveBeenCalledWith(mockAuth, "restaurants.customers.create");
      expect(mockFactory.create).toHaveBeenCalledOnce();
      expect(mockRepository.save).toHaveBeenCalledOnce();
      expect(mockEventBus.emit).toHaveBeenCalledWith("CustomerCreated", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
      expect(mockCacheInvalidator.invalidateOnCreate).toHaveBeenCalledOnce();
    });

    it("throws validation error when no contact method", async () => {
      await expect(
        service.create(
          {
            restaurantId: "rest-1",
            firstName: "John",
            lastName: "Doe",
            email: null,
            phone: null,
          },
          mockAuth,
        ),
      ).rejects.toThrow(CustomerValidationError);
    });

    it("throws duplicate error when email exists", async () => {
      mockDuplicatePolicy.checkEmail.mockRejectedValue(
        new DuplicateCustomerError("email", "existing@example.com"),
      );

      await expect(
        service.create(
          {
            restaurantId: "rest-1",
            firstName: "John",
            lastName: "Doe",
            email: "existing@example.com",
          },
          mockAuth,
        ),
      ).rejects.toThrow(DuplicateCustomerError);
    });

    it("creates customer with phone only", async () => {
      mockRepository.save.mockResolvedValue(
        createMockCustomer({ email: null, phone: CustomerPhone.create("+1234567890") }),
      );

      const result = await service.create(
        {
          restaurantId: "rest-1",
          firstName: "John",
          lastName: "Doe",
          phone: "+1234567890",
        },
        mockAuth,
      );

      expect(result.email).toBeNull();
    });
  });

  describe("update", () => {
    it("updates a customer successfully", async () => {
      const result = await service.update(
        {
          id: "cust-1",
          restaurantId: "rest-1",
          firstName: "Jane",
        },
        mockAuth,
      );

      expect(result.id).toBe("cust-1");
      expect(mockAuthService.authorize).toHaveBeenCalledWith(mockAuth, "restaurants.customers.update");
      expect(mockRepository.update).toHaveBeenCalledOnce();
      expect(mockEventBus.emit).toHaveBeenCalledWith("CustomerUpdated", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledOnce();
    });

    it("throws not found when customer does not exist", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

      await expect(
        service.update({ id: "missing", restaurantId: "rest-1" }, mockAuth),
      ).rejects.toThrow(CustomerNotFoundError);
    });

    it("throws when updating archived customer", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockCustomer({ status: CustomerStatus.create("archived") }),
      );

      await expect(
        service.update({ id: "cust-1", restaurantId: "rest-1", firstName: "Jane" }, mockAuth),
      ).rejects.toThrow(CustomerValidationError);
    });

    it("validates status transition", async () => {
      await expect(
        service.update(
          { id: "cust-1", restaurantId: "rest-1", status: "archived" },
          mockAuth,
        ),
      ).resolves.toBeDefined();

      await expect(
        service.update(
          { id: "cust-1", restaurantId: "rest-1", status: "invalid" },
          mockAuth,
        ),
      ).rejects.toThrow();
    });

    it("sets archivedAt when status changes to archived", async () => {
      const archivedCustomer = createMockCustomer({
        status: CustomerStatus.create("archived"),
        archivedAt: new Date(),
      });
      mockRepository.update.mockResolvedValue(archivedCustomer);

      const result = await service.update(
        { id: "cust-1", restaurantId: "rest-1", status: "archived" },
        mockAuth,
      );

      expect(result.status).toBe("archived");
      expect(mockEventBus.emit).toHaveBeenCalledWith("CustomerArchived", expect.any(Object));
    });

    it("checks email duplicate when email changes", async () => {
      mockDuplicatePolicy.checkEmail.mockRejectedValue(
        new DuplicateCustomerError("email", "taken@example.com"),
      );

      await expect(
        service.update(
          {
            id: "cust-1",
            restaurantId: "rest-1",
            email: "taken@example.com",
          },
          mockAuth,
        ),
      ).rejects.toThrow(DuplicateCustomerError);

      expect(mockDuplicatePolicy.checkEmail).toHaveBeenCalledOnce();
    });
  });

  describe("archive", () => {
    it("archives a customer successfully", async () => {
      const archivedCustomer = createMockCustomer({
        status: CustomerStatus.create("archived"),
        archivedAt: new Date(),
      });
      mockRepository.update.mockResolvedValue(archivedCustomer);

      const result = await service.archive(
        { id: "cust-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.status).toBe("archived");
      expect(mockAuthService.authorize).toHaveBeenCalledWith(mockAuth, "restaurants.customers.archive");
      expect(mockEventBus.emit).toHaveBeenCalledWith("CustomerArchived", expect.any(Object));
      expect(mockAuditService.record).toHaveBeenCalledTimes(1);
      expect(mockCacheInvalidator.invalidateOnArchive).toHaveBeenCalledOnce();
    });

    it("throws not found", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

      await expect(
        service.archive({ id: "missing", restaurantId: "rest-1" }, mockAuth),
      ).rejects.toThrow(CustomerNotFoundError);
    });

    it("throws when already archived", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(
        createMockCustomer({ status: CustomerStatus.create("archived") }),
      );

      await expect(
        service.archive({ id: "cust-1", restaurantId: "rest-1" }, mockAuth),
      ).rejects.toThrow(CustomerValidationError);
    });
  });

  describe("getById", () => {
    it("returns customer by id", async () => {
      const result = await service.getById(
        { id: "cust-1", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result.id).toBe("cust-1");
    });

    it("throws not found", async () => {
      mockRepository.findByIdAndRestaurant.mockResolvedValue(null);

      await expect(
        service.getById({ id: "missing", restaurantId: "rest-1" }, mockAuth),
      ).rejects.toThrow(CustomerNotFoundError);
    });
  });

  describe("list", () => {
    it("returns summaries", async () => {
      const results = await service.list(
        { restaurantId: "rest-1" },
        mockAuth,
      );

      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe("John");
    });

    it("filters by status", async () => {
      mockRepository.findByRestaurantId.mockResolvedValue([
        createMockCustomer({ id: "c1", status: CustomerStatus.create("active") }),
        createMockCustomer({ id: "c2", status: CustomerStatus.create("blocked") }),
      ]);

      const results = await service.list(
        { restaurantId: "rest-1", status: "blocked" },
        mockAuth,
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("c2");
    });

    it("filters by search term", async () => {
      mockRepository.findByRestaurantId.mockResolvedValue([
        createMockCustomer({ id: "c1", name: CustomerName.create("Alice", "Smith") }),
        createMockCustomer({ id: "c2", name: CustomerName.create("Bob", "Jones") }),
      ]);

      const results = await service.list(
        { restaurantId: "rest-1", search: "alice" },
        mockAuth,
      );

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("c1");
    });
  });

  describe("findByEmail", () => {
    it("finds customer by email", async () => {
      const result = await service.findByEmail(
        { email: "john@example.com", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe("cust-1");
    });

    it("returns null when not found", async () => {
      mockRepository.findByEmailAndRestaurant.mockResolvedValue(null);

      const result = await service.findByEmail(
        { email: "missing@example.com", restaurantId: "rest-1" },
        mockAuth,
      );

      expect(result).toBeNull();
    });
  });
});
