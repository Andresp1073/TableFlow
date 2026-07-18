import { describe, it, expect } from 'vitest';
import type { ApiResponse, ApiError, PaginationMeta } from '../types/index.js';
import type { LoginRequest, LoginResponse, SessionInfo } from '../modules/auth/auth.types.js';
import type { RestaurantDTO, RestaurantListDTO } from '../modules/restaurant/application/dtos/index.js';
import type { DiningAreaDTO } from '../modules/restaurant/dining-areas/application/dto/DiningAreaDTO.js';
import type { TableTypeDTO } from '../modules/restaurant/table-types/application/dto/TableTypeDTO.js';
import type { TableDTO } from '../modules/restaurant/tables/application/dto/TableDTO.js';
import type { TableAvailabilityDTO, ListAvailableTablesResultDTO, AvailabilityCheckDTO } from '../modules/restaurant/tables/application/dto/TableAvailabilityDTO.js';
import type { StatusTransitionDTO, StatusChangeResultDTO } from '../modules/restaurant/tables/application/dto/StatusTransitionDTO.js';
import type { ReservationDTO, ReservationSummary, CreateReservationRequest, UpdateReservationRequest } from '../modules/restaurant/reservations/application/dto/index.js';
import type { AuditEntryDTO, PaginatedAuditEntryDTO } from '../modules/audit/application/dto/index.js';

describe('API Contract - Response Shape', () => {
  it('ApiResponse success shape is valid', () => {
    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: '123' },
      timestamp: new Date().toISOString(),
    };
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ id: '123' });
    expect(response.timestamp).toBeDefined();
    expect(response.meta).toBeUndefined();
    expect(response.message).toBeUndefined();
    expect(response.error).toBeUndefined();
  });

  it('ApiResponse paginated shape is valid', () => {
    const response: ApiResponse<Array<{ id: string }>> = {
      success: true,
      data: [{ id: '1' }, { id: '2' }],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      timestamp: new Date().toISOString(),
    };
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.meta).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it('ApiResponse error shape is valid', () => {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'validation.failed',
        message: 'Validation failed',
        details: { email: ['Invalid email'] },
        timestamp: new Date().toISOString(),
        path: '/api/v1/auth/login',
        correlationId: 'req-123',
      },
      timestamp: new Date().toISOString(),
    };
    expect(response.success).toBe(false);
    expect(response.data).toBeNull();
    expect(response.error).toMatchObject({
      code: 'validation.failed',
      message: expect.any(String),
      timestamp: expect.any(String),
      path: expect.any(String),
      correlationId: expect.any(String),
    });
  });

  it('ApiResponse success with message shape is valid', () => {
    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString(),
    };
    expect(response.success).toBe(true);
    expect(response.data).toBeNull();
    expect(response.message).toBe('Password changed successfully');
  });

  it('PaginationMeta shape is valid', () => {
    const meta: PaginationMeta = {
      page: 1,
      limit: 10,
      total: 42,
      totalPages: 5,
    };
    expect(meta.page).toBeGreaterThanOrEqual(1);
    expect(meta.limit).toBeGreaterThanOrEqual(1);
    expect(meta.limit).toBeLessThanOrEqual(100);
    expect(meta.total).toBeGreaterThanOrEqual(0);
    expect(meta.totalPages).toBeGreaterThanOrEqual(0);
    expect(meta.totalPages).toBe(Math.ceil(meta.total / meta.limit));
  });

  it('ApiError validation details shape is valid', () => {
    const error: ApiError = {
      code: 'validation.failed',
      message: 'Validation failed',
      details: {
        email: ['Invalid email format'],
        password: ['Password must be at least 8 characters'],
      },
      timestamp: new Date().toISOString(),
      path: '/api/v1/auth/register',
      correlationId: 'req-456',
    };
    expect(error.code).toBe('validation.failed');
    expect(typeof error.message).toBe('string');
    expect(error.details).toBeDefined();
    expect(Object.keys(error['details']!)).toContain('email');
    expect(Array.isArray(error['details']!['email'])).toBe(true);
    expect(error['details']!['email']![0]).toBe('Invalid email format');
  });
});

describe('API Contract - Error Codes', () => {
  const validErrorCodes = [
    'validation.failed',
    'auth.token.missing',
    'auth.token.invalid',
    'auth.token.expired',
    'auth.token.revoked',
    'auth.invalid_credentials',
    'auth.account_locked',
    'auth.account_disabled',
    'auth.forbidden',
    'resource.not_found',
    'resource.duplicate',
    'rate_limit.exceeded',
    'internal.error',
  ] as const;

  for (const code of validErrorCodes) {
    it(`error code "${code}" uses dot notation`, () => {
      expect(code).toMatch(/^[a-z][a-z_]*(\.[a-z_]+)+$/);
    });
  }
});

describe('API Contract - HTTP Status Codes', () => {
  const statusCodes: Record<string, number> = {
    success: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
    tooManyRequests: 429,
    internalError: 500,
  };

  for (const [name, code] of Object.entries(statusCodes)) {
    it(`HTTP ${code} (${name}) is within valid range`, () => {
      expect(code).toBeGreaterThanOrEqual(100);
      expect(code).toBeLessThan(600);
    });
  }
});

describe('API Contract - Pagination', () => {
  it('page must be >= 1', () => {
    const valid = (page: number) => page >= 1;
    expect(valid(1)).toBe(true);
    expect(valid(0)).toBe(false);
    expect(valid(-1)).toBe(false);
  });

  it('limit must be between 1 and 100', () => {
    const valid = (limit: number) => limit >= 1 && limit <= 100;
    expect(valid(1)).toBe(true);
    expect(valid(50)).toBe(true);
    expect(valid(100)).toBe(true);
    expect(valid(0)).toBe(false);
    expect(valid(101)).toBe(false);
  });

  it('totalPages calculation', () => {
    expect(Math.ceil(42 / 10)).toBe(5);
    expect(Math.ceil(10 / 10)).toBe(1);
    expect(Math.ceil(0 / 10)).toBe(0);
    expect(Math.ceil(1 / 10)).toBe(1);
  });
});

describe('API Contract - Auth Endpoints', () => {
  it('LoginRequest shape is valid', () => {
    const body: LoginRequest = {
      email: 'test@example.com',
      password: 'securePass123',
    };
    expect(typeof body.email).toBe('string');
    expect(typeof body.password).toBe('string');
    expect(body.email).toContain('@');
  });

  it('LoginResponse shape is valid when wrapped in ApiResponse', () => {
    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ',
        refreshToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0NTYifQ',
        expiresIn: 900,
        user: {
          id: 'user-123',
          email: 'admin@tableflow.io',
          firstName: 'John',
          lastName: 'Doe',
          role: 'Admin',
        },
      },
      message: 'Authentication successful',
      timestamp: new Date().toISOString(),
    };
    expect(response.success).toBe(true);
    expect(response.data.accessToken).toMatch(/^eyJ/);
    expect(response.data.refreshToken).toMatch(/^eyJ/);
    expect(response.data.expiresIn).toBeGreaterThan(0);
    expect(response.data.user.id).toBeDefined();
    expect(response.data.user.email).toContain('@');
    expect(response.data.user.firstName).toBe('John');
    expect(response.data.user.lastName).toBe('Doe');
    expect(response.data.user.role).toBeDefined();
    expect(response.message).toBe('Authentication successful');
  });

  it('SessionInfo shape is valid', () => {
    const session: SessionInfo = {
      id: 'sess-456',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      isCurrent: true,
    };
    expect(session.id).toBeDefined();
    expect(session.ipAddress).toBe('192.168.1.1');
    expect(session.userAgent).toBe('Mozilla/5.0');
    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.expiresAt).toBeInstanceOf(Date);
    expect(typeof session.isCurrent).toBe('boolean');
  });

  it('SessionInfo with nullable fields is valid', () => {
    const session: SessionInfo = {
      id: 'sess-789',
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
      expiresAt: new Date(),
      isCurrent: false,
    };
    expect(session.ipAddress).toBeNull();
    expect(session.userAgent).toBeNull();
    expect(session.isCurrent).toBe(false);
  });
});

describe('API Contract - Restaurant Endpoints', () => {
  it('RestaurantDTO shape is valid when wrapped in ApiResponse', () => {
    const response: ApiResponse<RestaurantDTO> = {
      success: true,
      data: {
        id: 'rest-001',
        name: 'The Gourmet Kitchen',
        slug: 'the-gourmet-kitchen',
        legalName: 'Gourmet Kitchen LLC',
        taxId: '12-3456789',
        email: 'contact@gourmetkitchen.com',
        phone: '+1-555-0199',
        website: 'https://gourmetkitchen.com',
        logoUrl: 'https://cdn.tableflow.io/logos/rest-001.png',
        address: '123 Main St, New York, NY 10001',
        status: 'active',
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en',
        createdAt: '2025-01-15T10:00:00.000Z',
        updatedAt: '2025-06-01T12:00:00.000Z',
        deletedAt: null,
      },
      timestamp: new Date().toISOString(),
    };
    expect(response.success).toBe(true);
    expect(response.data.id).toBe('rest-001');
    expect(response.data.name).toBe('The Gourmet Kitchen');
    expect(response.data.slug).toBe('the-gourmet-kitchen');
    expect(response.data.status).toBe('active');
    expect(response.data.timezone).toBe('America/New_York');
    expect(response.data.currency).toBe('USD');
    expect(response.data.language).toBe('en');
    expect(response.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(response.data.deletedAt).toBeNull();
  });

  it('RestaurantListDTO (paginated) shape is valid', () => {
    const list: RestaurantListDTO = {
      data: [
        {
          id: 'rest-001',
          name: 'Restaurant One',
          slug: 'restaurant-one',
          legalName: null,
          taxId: null,
          email: null,
          phone: null,
          website: null,
          logoUrl: null,
          address: null,
          status: 'active',
          timezone: 'UTC',
          currency: 'USD',
          language: 'en',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-06-01T00:00:00.000Z',
          deletedAt: null,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    expect(Array.isArray(list.data)).toBe(true);
    expect(list.data.length).toBe(1);
    expect(list.total).toBe(1);
    expect(list.page).toBe(1);
    expect(list.limit).toBe(10);
    expect(list.totalPages).toBe(1);
    expect(list.data[0]!.name).toBe('Restaurant One');
  });

  it('Restaurant status enum variants are valid', () => {
    const statuses = ['active', 'suspended', 'archived', 'inactive'] as const;
    for (const s of statuses) {
      expect(['active', 'suspended', 'archived', 'inactive']).toContain(s);
    }
  });
});

describe('API Contract - Dining Area Endpoints', () => {
  it('DiningAreaDTO shape is valid', () => {
    const dto: DiningAreaDTO = {
      id: 'area-001',
      restaurantId: 'rest-001',
      name: 'Main Dining Room',
      code: 'MDR',
      description: 'Main dining area with garden view',
      displayOrder: 1,
      status: 'active',
      isReservable: true,
      createdAt: '2025-02-01T08:00:00.000Z',
      updatedAt: '2025-05-15T10:00:00.000Z',
    };
    expect(dto.id).toBe('area-001');
    expect(dto.restaurantId).toBe('rest-001');
    expect(dto.name).toBe('Main Dining Room');
    expect(dto.code).toMatch(/^[A-Z]{2,5}$/);
    expect(typeof dto.displayOrder).toBe('number');
    expect(typeof dto.isReservable).toBe('boolean');
    expect(dto.status).toMatch(/^(active|inactive|archived)$/);
  });

  it('DiningAreaDTO list wrapped in ApiResponse is valid', () => {
    const response: ApiResponse<DiningAreaDTO[]> = {
      success: true,
      data: [
        {
          id: 'area-001',
          restaurantId: 'rest-001',
          name: 'Main Dining Room',
          code: 'MDR',
          description: null,
          displayOrder: 1,
          status: 'active',
          isReservable: true,
          createdAt: '2025-02-01T08:00:00.000Z',
          updatedAt: '2025-05-15T10:00:00.000Z',
        },
      ],
      timestamp: new Date().toISOString(),
    };
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data[0]!.description).toBeNull();
  });
});

describe('API Contract - Table Type Endpoints', () => {
  it('TableTypeDTO shape is valid', () => {
    const dto: TableTypeDTO = {
      id: 'tt-001',
      restaurantId: 'rest-001',
      name: 'Round Booth',
      code: 'RB',
      description: 'Round booth for 4-6 guests',
      defaultCapacity: 4,
      minimumCapacity: 2,
      maximumCapacity: 6,
      shape: 'round',
      isReservable: true,
      displayOrder: 1,
      status: 'active',
      metadata: { color: 'red', material: 'velvet' },
      createdAt: '2025-01-10T00:00:00.000Z',
      updatedAt: '2025-04-20T00:00:00.000Z',
    };
    expect(dto.id).toBe('tt-001');
    expect(dto.name).toBe('Round Booth');
    expect(dto.defaultCapacity).toBeGreaterThanOrEqual(dto.minimumCapacity);
    expect(dto.maximumCapacity).toBeGreaterThanOrEqual(dto.defaultCapacity);
    expect(dto.shape).toMatch(/^(round|square|rectangle|oval|booth)$/);
    expect(typeof dto.isReservable).toBe('boolean');
    expect(dto.status).toMatch(/^(active|inactive|archived)$/);
    expect(dto.metadata).toBeDefined();
    expect(dto.metadata!['color']).toBe('red');
  });

  it('TableTypeDTO with nullable fields is valid', () => {
    const dto: TableTypeDTO = {
      id: 'tt-002',
      restaurantId: 'rest-001',
      name: 'Bar Stool',
      code: 'BS',
      description: null,
      defaultCapacity: 1,
      minimumCapacity: 1,
      maximumCapacity: 1,
      shape: 'round',
      isReservable: false,
      displayOrder: 10,
      status: 'active',
      metadata: null,
      createdAt: '2025-01-10T00:00:00.000Z',
      updatedAt: '2025-04-20T00:00:00.000Z',
    };
    expect(dto.description).toBeNull();
    expect(dto.metadata).toBeNull();
    expect(dto.isReservable).toBe(false);
  });
});

describe('API Contract - Table Endpoints', () => {
  it('TableDTO shape is valid', () => {
    const dto: TableDTO = {
      id: 'tbl-001',
      restaurantId: 'rest-001',
      branchId: 'branch-001',
      diningAreaId: 'area-001',
      tableTypeId: 'tt-001',
      tableNumber: 'T1',
      name: 'Window Table 1',
      description: 'Table by the north window',
      minimumCapacity: 2,
      maximumCapacity: 6,
      currentCapacity: 4,
      shape: 'rectangle',
      width: 120,
      height: 75,
      positionX: 100,
      positionY: 200,
      rotation: 0,
      qrIdentifier: 'qr-tbl-001',
      isReservable: true,
      isAccessible: true,
      isActive: true,
      status: 'available',
      metadata: { view: 'garden' },
      createdAt: '2025-03-01T00:00:00.000Z',
      updatedAt: '2025-05-01T00:00:00.000Z',
      deletedAt: null,
    };
    expect(dto.id).toBe('tbl-001');
    expect(dto.tableNumber).toBe('T1');
    expect(dto.currentCapacity).toBeGreaterThanOrEqual(dto.minimumCapacity);
    expect(dto.currentCapacity).toBeLessThanOrEqual(dto.maximumCapacity);
    expect(dto.status).toMatch(/^(available|occupied|reserved|maintenance|cleaning)$/);
    expect(typeof dto.isReservable).toBe('boolean');
    expect(typeof dto.isAccessible).toBe('boolean');
    expect(typeof dto.isActive).toBe('boolean');
    expect(dto.positionX).toBe(100);
    expect(dto.positionY).toBe(200);
    expect(dto.deletedAt).toBeNull();
  });

  it('StatusTransitionDTO shape is valid', () => {
    const dto: StatusTransitionDTO = {
      status: 'available',
      allowedTransitions: ['occupied', 'reserved', 'maintenance'],
    };
    expect(dto.status).toBe('available');
    expect(Array.isArray(dto.allowedTransitions)).toBe(true);
    expect(dto.allowedTransitions.length).toBeGreaterThan(0);
    expect(dto.allowedTransitions).not.toContain(dto.status);
  });

  it('StatusChangeResultDTO shape is valid', () => {
    const dto: StatusChangeResultDTO = {
      id: 'tbl-001',
      tableNumber: 'T1',
      previousStatus: 'available',
      newStatus: 'occupied',
      updatedAt: '2025-06-01T12:00:00.000Z',
    };
    expect(dto.id).toBe('tbl-001');
    expect(dto.previousStatus).not.toBe(dto.newStatus);
    expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('TableAvailabilityDTO shape is valid', () => {
    const dto: TableAvailabilityDTO = {
      tableId: 'tbl-001',
      available: true,
      reason: null,
    };
    expect(dto.tableId).toBe('tbl-001');
    expect(dto.available).toBe(true);
    expect(dto.reason).toBeNull();
  });

  it('TableAvailabilityDTO when unavailable includes reason', () => {
    const dto: TableAvailabilityDTO = {
      tableId: 'tbl-002',
      available: false,
      reason: 'Already reserved for the time slot',
    };
    expect(dto.available).toBe(false);
    expect(dto.reason).toBe('Already reserved for the time slot');
  });

  it('AvailabilityCheckDTO shape is valid', () => {
    const dto: AvailabilityCheckDTO = {
      available: true,
      reason: null,
      details: [
        {
          evaluator: 'TimeSlotEvaluator',
          available: true,
          reason: null,
        },
        {
          evaluator: 'CapacityEvaluator',
          available: true,
          reason: null,
        },
      ],
    };
    expect(dto.available).toBe(true);
    expect(Array.isArray(dto.details)).toBe(true);
    expect(dto.details!.length).toBe(2);
    expect(dto.details![0]!.evaluator).toBe('TimeSlotEvaluator');
  });

  it('ListAvailableTablesResultDTO shape is valid', () => {
    const dto: ListAvailableTablesResultDTO = {
      availableTables: [
        { tableId: 'tbl-001', available: true, reason: null },
        { tableId: 'tbl-002', available: false, reason: 'Capacity too low' },
      ],
      totalTables: 10,
      availableCount: 1,
    };
    expect(dto.totalTables).toBe(10);
    expect(dto.availableCount).toBe(1);
    expect(dto.availableTables!.length).toBe(2);
    expect(dto.availableTables[0]!.available).toBe(true);
    expect(dto.availableTables[1]!.available).toBe(false);
    expect(dto.availableCount).toBeLessThanOrEqual(dto.totalTables);
  });
});

describe('API Contract - Reservation Endpoints', () => {
  it('CreateReservationRequest shape is valid', () => {
    const body: CreateReservationRequest = {
      restaurantId: 'rest-001',
      reservationNumber: 'RES-20250601-001',
      customerId: 'cust-001',
      tableId: 'tbl-001',
      tableGroupId: null,
      date: '2025-06-15T00:00:00.000Z',
      startTime: '2025-06-15T19:00:00.000Z',
      endTime: '2025-06-15T21:00:00.000Z',
      partySize: 4,
      source: 'website',
      notes: 'Anniversary dinner',
      specialRequests: 'Window table preferred',
    };
    expect(body.restaurantId).toBe('rest-001');
    expect(body.partySize).toBeGreaterThan(0);
    expect(new Date(body.startTime) < new Date(body.endTime)).toBe(true);
    expect(body.source).toBe('website');
  });

  it('UpdateReservationRequest with partial fields is valid', () => {
    const body: UpdateReservationRequest = {
      partySize: 6,
      notes: 'Updated to 6 guests',
    };
    expect(body.partySize).toBe(6);
    expect(body.notes).toBe('Updated to 6 guests');
    expect(body.date).toBeUndefined();
    expect(body.tableId).toBeUndefined();
  });

  it('ReservationDTO shape is valid', () => {
    const dto: ReservationDTO = {
      id: 'res-001',
      restaurantId: 'rest-001',
      reservationNumber: 'RES-20250601-001',
      customerId: 'cust-001',
      tableId: 'tbl-001',
      tableGroupId: null,
      date: '2025-06-15T00:00:00.000Z',
      startTime: '2025-06-15T19:00:00.000Z',
      endTime: '2025-06-15T21:00:00.000Z',
      partySize: 4,
      status: 'confirmed',
      source: 'website',
      notes: 'Anniversary dinner',
      specialRequests: 'Window table preferred',
      createdBy: 'user-001',
      createdAt: '2025-06-01T10:00:00.000Z',
      updatedAt: '2025-06-01T10:00:00.000Z',
      cancelledAt: null,
    };
    expect(dto.id).toBe('res-001');
    expect(dto.status).toMatch(/^(pending|confirmed|seated|completed|cancelled|no_show)$/);
    expect(new Date(dto.startTime) < new Date(dto.endTime)).toBe(true);
    expect(dto.partySize).toBeGreaterThan(0);
    expect(dto.cancelledAt).toBeNull();
  });

  it('ReservationDTO cancelled state is valid', () => {
    const dto: ReservationDTO = {
      id: 'res-002',
      restaurantId: 'rest-001',
      reservationNumber: 'RES-20250601-002',
      customerId: null,
      tableId: null,
      tableGroupId: null,
      date: '2025-06-15T00:00:00.000Z',
      startTime: '2025-06-15T19:00:00.000Z',
      endTime: '2025-06-15T21:00:00.000Z',
      partySize: 2,
      status: 'cancelled',
      source: 'phone',
      notes: null,
      specialRequests: null,
      createdBy: 'user-002',
      createdAt: '2025-06-01T10:00:00.000Z',
      updatedAt: '2025-06-02T08:00:00.000Z',
      cancelledAt: '2025-06-02T08:00:00.000Z',
    };
    expect(dto.status).toBe('cancelled');
    expect(dto.customerId).toBeNull();
    expect(dto.tableId).toBeNull();
    expect(dto.notes).toBeNull();
    expect(dto.cancelledAt).toBeTruthy();
  });

  it('ReservationSummary shape is valid', () => {
    const summary: ReservationSummary = {
      id: 'res-001',
      restaurantId: 'rest-001',
      reservationNumber: 'RES-20250601-001',
      customerId: 'cust-001',
      date: '2025-06-15T00:00:00.000Z',
      startTime: '2025-06-15T19:00:00.000Z',
      endTime: '2025-06-15T21:00:00.000Z',
      partySize: 4,
      status: 'confirmed',
      source: 'website',
      createdAt: '2025-06-01T10:00:00.000Z',
    };
    expect(summary.id).toBe('res-001');
    expect(summary.status).toBe('confirmed');
    expect((summary as unknown as Record<string, unknown>)['tableId']).toBeUndefined();
    expect((summary as unknown as Record<string, unknown>)['notes']).toBeUndefined();
  });
});

describe('API Contract - Audit Endpoints', () => {
  it('AuditEntryDTO shape is valid', () => {
    const dto: AuditEntryDTO = {
      id: 'aud-001',
      organizationId: 'org-001',
      module: 'restaurant',
      entityType: 'Restaurant',
      entityId: 'rest-001',
      action: 'restaurant.created',
      performedBy: 'user-001',
      restaurantId: 'rest-001',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-abc-123',
      oldValues: null,
      newValues: { name: 'New Name' },
      metadata: { reason: 'Rebranding' },
      createdAt: '2025-06-01T10:00:00.000Z',
    };
    expect(dto.id).toBe('aud-001');
    expect(dto.module).toBe('restaurant');
    expect(dto.action).toMatch(/^[a-z]+\.[a-z]+/);
    expect(dto.oldValues).toBeNull();
    expect(dto.newValues).toEqual({ name: 'New Name' });
    expect(dto.metadata).toEqual({ reason: 'Rebranding' });
  });

  it('PaginatedAuditEntryDTO shape is valid', () => {
    const dto: PaginatedAuditEntryDTO = {
      items: [
        {
          id: 'aud-001',
          organizationId: 'org-001',
          module: 'auth',
          entityType: 'User',
          entityId: 'user-001',
          action: 'auth.login',
          performedBy: 'user-001',
          restaurantId: null,
          ipAddress: null,
          userAgent: null,
          requestId: null,
          oldValues: null,
          newValues: null,
          metadata: null,
          createdAt: '2025-06-01T10:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    };
    expect(Array.isArray(dto.items)).toBe(true);
    expect(dto.items.length).toBe(1);
    expect(dto.total).toBe(1);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(50);
    expect(dto.totalPages).toBe(1);
    expect(dto.items[0]!.restaurantId).toBeNull();
  });

  it('AuditEntryDTO with full nullables is valid', () => {
    const dto: AuditEntryDTO = {
      id: 'aud-002',
      organizationId: 'org-001',
      module: 'system',
      entityType: 'HealthCheck',
      entityId: 'hc-001',
      action: 'system.health',
      performedBy: null,
      restaurantId: null,
      ipAddress: null,
      userAgent: null,
      requestId: null,
      oldValues: null,
      newValues: null,
      metadata: null,
      createdAt: '2025-06-01T10:00:00.000Z',
    };
    expect(dto.performedBy).toBeNull();
    expect(dto.restaurantId).toBeNull();
    expect(dto.ipAddress).toBeNull();
    expect(dto.oldValues).toBeNull();
    expect(dto.newValues).toBeNull();
    expect(dto.metadata).toBeNull();
  });
});

describe('API Contract - Error Response Integration', () => {
  it('error with details inside ApiResponse is valid', () => {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'validation.failed',
        message: 'Validation failed',
        details: {
          email: ['Invalid email format'],
          password: ['Password must be at least 8 characters'],
        },
        timestamp: new Date().toISOString(),
        path: '/api/v1/auth/register',
        correlationId: 'req-789',
      },
      timestamp: new Date().toISOString(),
    };
    expect(response.success).toBe(false);
    expect(response.data).toBeNull();
    expect(response.error!.code).toBe('validation.failed');
    expect(response.error!.path).toBe('/api/v1/auth/register');
    expect(Object.keys(response.error!.details!)).toEqual(['email', 'password']);
  });

  it('401 unauthorized error shape is valid', () => {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'auth.token.missing',
        message: 'Authentication token is missing',
        timestamp: new Date().toISOString(),
        path: '/api/v1/restaurants',
        correlationId: 'req-abc',
      },
      timestamp: new Date().toISOString(),
    };
    expect(response.error!.code).toMatch(/^auth\./);
    expect(response.error!.details).toBeUndefined();
  });

  it('404 not found error shape is valid', () => {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'resource.not_found',
        message: 'Restaurant with id rest-999 not found',
        timestamp: new Date().toISOString(),
        path: '/api/v1/restaurants/rest-999',
        correlationId: 'req-def',
      },
      timestamp: new Date().toISOString(),
    };
    expect(response.error!.code).toBe('resource.not_found');
  });

  it('429 rate limit error shape is valid', () => {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'rate_limit.exceeded',
        message: 'Too many requests. Please try again later.',
        timestamp: new Date().toISOString(),
        path: '/api/v1/auth/login',
        correlationId: 'req-xyz',
      },
      timestamp: new Date().toISOString(),
    };
    expect(response.error!.code).toBe('rate_limit.exceeded');
  });
});
