export enum KitchenPriority {
  Normal = "normal",
  High = "high",
  Urgent = "urgent",
  VIP = "vip",
  Delayed = "delayed",
}

export const KITCHEN_PRIORITY_ORDER: Record<KitchenPriority, number> = {
  [KitchenPriority.Normal]: 0,
  [KitchenPriority.High]: 1,
  [KitchenPriority.Urgent]: 2,
  [KitchenPriority.VIP]: 3,
  [KitchenPriority.Delayed]: 4,
};

export const KITCHEN_PRIORITIES: readonly KitchenPriority[] = Object.values(KitchenPriority);

export function comparePriority(a: KitchenPriority, b: KitchenPriority): number {
  return KITCHEN_PRIORITY_ORDER[a] - KITCHEN_PRIORITY_ORDER[b];
}

export function sortByPriority(tickets: Array<{ priority: KitchenPriority; createdAt: Date }>): number {
  return (a: { priority: KitchenPriority; createdAt: Date }, b: { priority: KitchenPriority; createdAt: Date }): number => {
    const priorityDiff = KITCHEN_PRIORITY_ORDER[b.priority] - KITCHEN_PRIORITY_ORDER[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  };
}

export function isHigherPriority(a: KitchenPriority, b: KitchenPriority): boolean {
  return KITCHEN_PRIORITY_ORDER[a] > KITCHEN_PRIORITY_ORDER[b];
}
