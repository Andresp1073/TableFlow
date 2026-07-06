export abstract class BaseService {
  protected validateRequired<T extends Record<string, unknown>>(
    data: T,
    fields: (keyof T)[],
  ): void {
    for (const field of fields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`Field "${String(field)} is required`);
      }
    }
  }
}
