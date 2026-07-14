import type {
  SecurityPolicy as SecurityPolicyInterface,
  SecurityPolicyResult,
  SecurityContext,
  SecurityPolicyType,
} from "./types.js";

export abstract class BaseSecurityPolicy implements SecurityPolicyInterface {
  abstract readonly type: SecurityPolicyType;
  abstract readonly name: string;
  abstract readonly enabled: boolean;
  abstract evaluate(context: SecurityContext, data: unknown): Promise<SecurityPolicyResult>;

  protected passed(severity: "low" | "medium" | "high" | "critical" = "low", message?: string, details?: Record<string, unknown>): SecurityPolicyResult {
    return {
      passed: true,
      policyName: this.name,
      policyType: this.type,
      severity,
      message,
      details,
    };
  }

  protected failed(severity: "low" | "medium" | "high" | "critical" = "high", message?: string, details?: Record<string, unknown>): SecurityPolicyResult {
    return {
      passed: false,
      policyName: this.name,
      policyType: this.type,
      severity,
      message,
      details,
    };
  }
}

export class InputValidationPolicy extends BaseSecurityPolicy {
  readonly type: SecurityPolicyType = "input_validation";
  readonly name: string;
  readonly enabled: boolean;

  constructor(name = "Input Validation Policy", enabled = true) {
    super();
    this.name = name;
    this.enabled = enabled;
  }

  override async evaluate(_context: SecurityContext, data: unknown): Promise<SecurityPolicyResult> {
    if (data === null || data === undefined) {
      return this.failed("medium", "Input data is null or undefined");
    }

    if (typeof data === "string" && data.trim().length === 0) {
      return this.failed("low", "Input data is empty string");
    }

    if (typeof data === "object" && !Array.isArray(data)) {
      const obj = data as Record<string, unknown>;
      const keys = Object.keys(obj);

      if (keys.length === 0) {
        return this.failed("low", "Input object has no properties");
      }
    }

    return this.passed("low", "Input validation passed");
  }
}

export class SensitiveDataPolicy extends BaseSecurityPolicy {
  readonly type: SecurityPolicyType = "sensitive_data";
  readonly name: string;
  readonly enabled: boolean;
  private readonly sensitivePatterns: RegExp[];

  constructor(
    name = "Sensitive Data Protection Policy",
    enabled = true,
    patterns?: RegExp[],
  ) {
    super();
    this.name = name;
    this.enabled = enabled;
    this.sensitivePatterns = patterns ?? [
      /password/i,
      /secret/i,
      /token/i,
      /authorization/i,
      /credential/i,
      /api[_-]?key/i,
      /ssn/i,
      /credit.?card/i,
      /cvv/i,
    ];
  }

  override async evaluate(_context: SecurityContext, data: unknown): Promise<SecurityPolicyResult> {
    if (typeof data === "string") {
      return this.checkString(data);
    }

    if (typeof data === "object" && data !== null) {
      return this.checkObject(data as Record<string, unknown>);
    }

    return this.passed("low", "No sensitive data detected");
  }

  private checkString(value: string): SecurityPolicyResult {
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(value)) {
        return this.failed(
          "high",
          `Potential sensitive data pattern detected: ${pattern.source}`,
          { matchedPattern: pattern.source },
        );
      }
    }

    return this.passed("low", "No sensitive data detected");
  }

  private checkObject(obj: Record<string, unknown>): SecurityPolicyResult {
    const findings: string[] = [];

    for (const key of Object.keys(obj)) {
      for (const pattern of this.sensitivePatterns) {
        if (pattern.test(key)) {
          findings.push(key);
        }
      }
    }

    if (findings.length > 0) {
      return this.failed(
        "high",
        `Sensitive data fields detected: ${findings.join(", ")}`,
        { sensitiveFields: findings },
      );
    }

    return this.passed("low", "No sensitive data detected");
  }
}

export class ResourceOwnershipPolicy extends BaseSecurityPolicy {
  readonly type: SecurityPolicyType = "resource_ownership";
  readonly name: string;
  readonly enabled: boolean;

  constructor(name = "Resource Ownership Policy", enabled = true) {
    super();
    this.name = name;
    this.enabled = enabled;
  }

  override async evaluate(context: SecurityContext, data: unknown): Promise<SecurityPolicyResult> {
    const resourceData = data as Record<string, unknown> | null;

    if (!resourceData) {
      return this.failed("medium", "No resource data provided for ownership check");
    }

    const resourceOwnerId = resourceData.ownerUserId as string | undefined;
    const resourceRestaurantId = resourceData.restaurantId as string | undefined;

    if (!resourceOwnerId && !resourceRestaurantId) {
      return this.passed("low", "Resource has no ownership constraints");
    }

    if (resourceRestaurantId && context.restaurantId && resourceRestaurantId !== context.restaurantId) {
      return this.failed(
        "critical",
        `Resource restaurant (${resourceRestaurantId}) does not match context restaurant (${context.restaurantId})`,
        { resourceRestaurantId, contextRestaurantId: context.restaurantId },
      );
    }

    if (resourceOwnerId && resourceOwnerId !== context.userId) {
      const userHasPermission = context.permissions.some(
        (p) => p.includes("admin") || p.includes("manage") || p.includes("override"),
      );

      if (!userHasPermission) {
        return this.failed(
          "high",
          `User ${context.userId} does not own resource owned by ${resourceOwnerId}`,
          { resourceOwnerId, currentUserId: context.userId },
        );
      }
    }

    return this.passed("low", "Resource ownership verified");
  }
}

export class OperationAuthorizationPolicy extends BaseSecurityPolicy {
  readonly type: SecurityPolicyType = "operation_authorization";
  readonly name: string;
  readonly enabled: boolean;

  constructor(name = "Operation Authorization Policy", enabled = true) {
    super();
    this.name = name;
    this.enabled = enabled;
  }

  override async evaluate(context: SecurityContext, data: unknown): Promise<SecurityPolicyResult> {
    const operationData = data as Record<string, unknown> | null;

    if (!operationData) {
      return this.failed("medium", "No operation data provided");
    }

    const requiredPermission = operationData.requiredPermission as string | undefined;

    if (!requiredPermission) {
      return this.passed("low", "No specific permission required");
    }

    const hasPermission = context.permissions.some(
      (p) => p === requiredPermission || p === "*" || p === "admin:*",
    );

    if (!hasPermission) {
      return this.failed(
        "critical",
        `User ${context.userId} lacks required permission: ${requiredPermission}`,
        { requiredPermission, userPermissions: context.permissions },
      );
    }

    return this.passed("low", `Operation authorized via permission: ${requiredPermission}`);
  }
}

export class SuspiciousActivityPolicy extends BaseSecurityPolicy {
  readonly type: SecurityPolicyType = "suspicious_activity";
  readonly name: string;
  readonly enabled: boolean;
  private readonly suspiciousPatterns: RegExp[];

  constructor(
    name = "Suspicious Activity Detection Policy",
    enabled = true,
    patterns?: RegExp[],
  ) {
    super();
    this.name = name;
    this.enabled = enabled;
    this.suspiciousPatterns = patterns ?? [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i,
      /(\%24|\$)\{.*\}/,
      /\.\.\/\.\.\//,
      /[<>'"\\]/,
    ];
  }

  override async evaluate(context: SecurityContext, data: unknown): Promise<SecurityPolicyResult> {
    if (typeof data === "string") {
      return this.checkValue(data, "input");
    }

    if (typeof data === "object" && data !== null) {
      return this.checkObject(data as Record<string, unknown>, "");
    }

    return this.passed("low", "No suspicious patterns detected");
  }

  private checkValue(value: string, fieldName: string): SecurityPolicyResult {
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(value)) {
        return this.failed(
          "high",
          `Suspicious pattern detected in field "${fieldName}": ${pattern.source}`,
          { field: fieldName, matchedPattern: pattern.source },
        );
      }
    }

    return this.passed("low", "No suspicious patterns detected");
  }

  private checkObject(obj: Record<string, unknown>, prefix: string): SecurityPolicyResult {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "string") {
        const result = this.checkValue(value, fieldPath);

        if (!result.passed) {
          return result;
        }
      } else if (typeof value === "object" && value !== null) {
        const result = this.checkObject(value as Record<string, unknown>, fieldPath);

        if (!result.passed) {
          return result;
        }
      }
    }

    return this.passed("low", "No suspicious patterns detected");
  }
}
