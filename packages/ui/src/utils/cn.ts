type ClassValue = string | boolean | undefined | null | ClassValue[];

export function cn(...classes: ClassValue[]): string {
  return classes
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');
}
