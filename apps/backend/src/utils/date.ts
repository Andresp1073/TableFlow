export function now(): Date {
  return new Date();
}

export function todayDateString(): string {
  return now().toISOString().split('T')[0] ?? '';
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isInPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toISOString(date: Date): string {
  return date.toISOString();
}

export function formatDateForDb(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function getStartOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function getEndOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
