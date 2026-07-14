import type { EntityKeyTemplate, KeyTemplate } from "./types.js";

export class CacheKeyFactory {
  private readonly entityTemplates = new Map<string, string>();
  private readonly namedTemplates = new Map<string, string>();

  registerEntity(entityType: string, template: string): void {
    this.entityTemplates.set(entityType, template);
  }

  registerTemplate(name: string, template: string): void {
    this.namedTemplates.set(name, template);
  }

  registerTemplates(templates: Record<string, string>): void {
    for (const [name, template] of Object.entries(templates)) {
      this.namedTemplates.set(name, template);
    }
  }

  registerEntities(entityTemplates: EntityKeyTemplate[]): void {
    for (const et of entityTemplates) {
      this.entityTemplates.set(et.entityType, et.template);
    }
  }

  forEntity(entityType: string, entityId: string): string {
    const template = this.entityTemplates.get(entityType);

    if (!template) {
      return `${entityType}:${entityId}`;
    }

    return this.format(template, { id: entityId });
  }

  forRestaurant(restaurantId: string): string {
    return this.forEntity("restaurant", restaurantId);
  }

  forReservation(reservationId: string): string {
    return this.forEntity("reservation", reservationId);
  }

  forAvailability(restaurantId: string, date: string): string {
    return `availability:${restaurantId}:${date}`;
  }

  forCalendar(restaurantId: string, day: string): string {
    return `calendar:${restaurantId}:${day}`;
  }

  build(template: string, params: Record<string, string | number>): string {
    return this.format(template, params);
  }

  fromTemplate(name: string, params: Record<string, string | number>): string | null {
    const template = this.namedTemplates.get(name);

    if (!template) {
      return null;
    }

    return this.format(template, params);
  }

  prefix(entityType: string): string {
    return `${entityType}:`;
  }

  private format(template: string, params: Record<string, string | number>): string {
    let result = template;

    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
    }

    return result;
  }

  hasEntityTemplate(entityType: string): boolean {
    return this.entityTemplates.has(entityType);
  }

  hasNamedTemplate(name: string): boolean {
    return this.namedTemplates.has(name);
  }

  getEntityTemplate(entityType: string): string | undefined {
    return this.entityTemplates.get(entityType);
  }

  getNamedTemplate(name: string): string | undefined {
    return this.namedTemplates.get(name);
  }

  static createDefault(): CacheKeyFactory {
    const factory = new CacheKeyFactory();

    factory.registerEntity("restaurant", "restaurant:{id}");
    factory.registerEntity("reservation", "reservation:{id}");
    factory.registerEntity("table", "table:{id}");
    factory.registerEntity("tableGroup", "tableGroup:{id}");
    factory.registerEntity("waitlist", "waitlist:{id}");
    factory.registerEntity("menu", "menu:{id}");

    factory.registerTemplates({
      "availability:day": "availability:{restaurantId}:{date}",
      "calendar:day": "calendar:{restaurantId}:{day}",
      "calendar:week": "calendar:{restaurantId}:week:{startDate}",
      "calendar:month": "calendar:{restaurantId}:month:{year}:{month}",
      "user:session": "user:session:{sessionId}",
      "user:profile": "user:profile:{userId}",
      "config:restaurant": "config:restaurant:{restaurantId}",
    });

    return factory;
  }
}
