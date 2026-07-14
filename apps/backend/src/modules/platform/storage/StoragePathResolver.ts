export type StoragePathPattern =
  | "restaurant-logo"
  | "restaurant-menu"
  | "reservation-attachment"
  | "user-avatar"
  | "export"
  | "backup"
  | "custom";

export interface PathTemplateConfig {
  pattern: string;
  description: string;
  examples: string[];
}

const DEFAULT_BUCKET = "tableflow";

const PATH_TEMPLATES: Record<StoragePathPattern, PathTemplateConfig> = {
  "restaurant-logo": {
    pattern: "restaurants/{restaurantId}/logo.{ext}",
    description: "Restaurant logo image",
    examples: ["restaurants/r-123/logo.png", "restaurants/r-456/logo.jpg"],
  },
  "restaurant-menu": {
    pattern: "menus/{restaurantId}/{menuId}.{ext}",
    description: "Restaurant menu document",
    examples: ["menus/r-123/m-789.pdf", "menus/r-456/m-012.json"],
  },
  "reservation-attachment": {
    pattern: "reservations/{reservationId}/{filename}",
    description: "Reservation attachment file",
    examples: ["reservations/res-abc/special-request.pdf", "reservations/res-def/receipt.png"],
  },
  "user-avatar": {
    pattern: "users/{userId}/avatar.{ext}",
    description: "User avatar image",
    examples: ["users/u-123/avatar.png", "users/u-456/avatar.jpg"],
  },
  "export": {
    pattern: "exports/{exportType}/{timestamp}-{id}.{ext}",
    description: "Exported data file",
    examples: ["exports/csv/20260714-12345-abc.csv", "exports/json/20260714-67890-def.json"],
  },
  "backup": {
    pattern: "backups/{component}/{date}/{filename}",
    description: "System backup file",
    examples: ["backups/database/2026-07-14/full-dump.sql", "backups/uploads/2026-07-14/uploads.tar.gz"],
  },
  "custom": {
    pattern: "custom/{path}",
    description: "Custom path pattern",
    examples: ["custom/any/path/file.txt"],
  },
};

export class StoragePathResolver {
  private readonly defaultBucket: string;

  constructor(defaultBucket = DEFAULT_BUCKET) {
    this.defaultBucket = defaultBucket;
  }

  getTemplate(pattern: StoragePathPattern): PathTemplateConfig {
    const template = PATH_TEMPLATES[pattern];

    if (!template) {
      throw new Error(`Unknown path pattern: "${pattern}"`);
    }

    return template;
  }

  getAllTemplates(): Record<StoragePathPattern, PathTemplateConfig> {
    return { ...PATH_TEMPLATES };
  }

  resolve(
    pattern: StoragePathPattern,
    params: Record<string, string>,
    bucket?: string,
  ): { path: string; bucket: string } {
    const template = this.getTemplate(pattern);
    let resolvedPath = template.pattern;

    for (const [key, value] of Object.entries(params)) {
      resolvedPath = resolvedPath.replaceAll(`{${key}}`, this.sanitizePathSegment(value));
    }

    const unresolved = resolvedPath.match(/\{[^}]+\}/g);

    if (unresolved && unresolved.length > 0) {
      throw new Error(
        `Missing parameters for path template "${pattern}": ${unresolved.join(", ")}`,
      );
    }

    return {
      path: resolvedPath,
      bucket: bucket ?? this.defaultBucket,
    };
  }

  resolveRestaurantLogo(restaurantId: string, ext: string, bucket?: string): { path: string; bucket: string } {
    return this.resolve("restaurant-logo", { restaurantId, ext }, bucket);
  }

  resolveRestaurantMenu(restaurantId: string, menuId: string, ext: string, bucket?: string): { path: string; bucket: string } {
    return this.resolve("restaurant-menu", { restaurantId, menuId, ext }, bucket);
  }

  resolveReservationAttachment(reservationId: string, filename: string, bucket?: string): { path: string; bucket: string } {
    return this.resolve("reservation-attachment", { reservationId, filename }, bucket);
  }

  resolveUserAvatar(userId: string, ext: string, bucket?: string): { path: string; bucket: string } {
    return this.resolve("user-avatar", { userId, ext }, bucket);
  }

  resolveExport(exportType: string, id: string, ext: string, bucket?: string): { path: string; bucket: string } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    return this.resolve("export", { exportType, timestamp, id, ext }, bucket);
  }

  resolveBackup(component: string, filename: string, bucket?: string): { path: string; bucket: string } {
    const date = new Date().toISOString().slice(0, 10);

    return this.resolve("backup", { component, date, filename }, bucket);
  }

  resolveCustom(path: string, bucket?: string): { path: string; bucket: string } {
    return {
      path,
      bucket: bucket ?? this.defaultBucket,
    };
  }

  parsePath(path: string): { pattern: StoragePathPattern | null; params: Record<string, string> } {
    for (const [patternName, template] of Object.entries(PATH_TEMPLATES)) {
      const regex = this.templateToRegex(template.pattern);
      const match = path.match(regex);

      if (match) {
        const params: Record<string, string> = {};
        const paramNames = template.pattern.match(/\{(\w+)\}/g) ?? [];

        for (let i = 0; i < paramNames.length; i++) {
          const name = paramNames[i].replace(/[{}]/g, "");
          const value = match[i + 1];

          if (value) {
            params[name] = value;
          }
        }

        return { pattern: patternName as StoragePathPattern, params };
      }
    }

    return { pattern: null, params: { path } };
  }

  getDefaultBucket(): string {
    return this.defaultBucket;
  }

  join(...segments: string[]): string {
    return segments
      .map((s) => s.replace(/^\/+|\/+$/g, ""))
      .filter(Boolean)
      .join("/");
  }

  dirname(path: string): string {
    const parts = path.replace(/\/+$/, "").split("/");

    parts.pop();

    return parts.join("/");
  }

  basename(path: string): string {
    const parts = path.replace(/\/+$/, "").split("/");

    return parts[parts.length - 1] ?? "";
  }

  extension(path: string): string {
    const base = this.basename(path);
    const dotIndex = base.lastIndexOf(".");

    return dotIndex > 0 ? base.slice(dotIndex + 1) : "";
  }

  private sanitizePathSegment(segment: string): string {
    return segment.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  private templateToRegex(template: string): RegExp {
    const escaped = template.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const regexStr = escaped.replace(/\\\{(\w+)\\\}/g, "([^/]+)");

    return new RegExp(`^${regexStr}$`);
  }
}
