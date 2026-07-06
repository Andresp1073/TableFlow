import { PrismaClient } from "@prisma/client";

interface RoleSeed {
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  color: string | null;
  icon: string | null;
}

const ROLES_TO_SEED: RoleSeed[] = [
  // ── System Roles ──────────────────────────────────────────────────────────
  {
    code: "super-admin",
    name: "Super Admin",
    description:
      "Unrestricted access across the entire platform. Can manage tenants, global settings, system configuration, and all data.",
    isSystem: true,
    isDefault: false,
    priority: 1000,
    color: "#DC2626",
    icon: "shield-check",
  },
  {
    code: "platform-admin",
    name: "Platform Admin",
    description:
      "Administrative access to platform operations excluding sensitive system configuration. Can manage tenants, support tickets, and monitor platform health.",
    isSystem: true,
    isDefault: false,
    priority: 900,
    color: "#EA580C",
    icon: "server",
  },
  {
    code: "support",
    name: "Support",
    description:
      "Read-only access across assigned organizations for troubleshooting and customer support. Cannot modify data or configuration.",
    isSystem: true,
    isDefault: false,
    priority: 800,
    color: "#2563EB",
    icon: "headset",
  },

  // ── Restaurant Default Roles ──────────────────────────────────────────────
  {
    code: "restaurant-owner",
    name: "Restaurant Owner",
    description:
      "Full ownership access to a single restaurant. Can manage users, roles, billing, settings, and all operational data.",
    isSystem: false,
    isDefault: true,
    priority: 700,
    color: "#7C3AED",
    icon: "crown",
  },
  {
    code: "restaurant-manager",
    name: "Restaurant Manager",
    description:
      "Operational management of a restaurant. Can manage staff, tables, reservations, menu, and view reports.",
    isSystem: false,
    isDefault: true,
    priority: 600,
    color: "#0891B2",
    icon: "briefcase",
  },
  {
    code: "host",
    name: "Host",
    description:
      "Front-of-house staff responsible for greeting guests, managing the waitlist, and coordinating table assignments.",
    isSystem: false,
    isDefault: true,
    priority: 500,
    color: "#059669",
    icon: "door-open",
  },
  {
    code: "waiter",
    name: "Waiter",
    description:
      "Floor staff with access to assigned section tables and reservations for taking orders and providing service.",
    isSystem: false,
    isDefault: true,
    priority: 400,
    color: "#0284C7",
    icon: "utensils-crossed",
  },
  {
    code: "cashier",
    name: "Cashier",
    description:
      "Staff responsible for processing payments, managing bills, and reconciling end-of-day transactions.",
    isSystem: false,
    isDefault: true,
    priority: 350,
    color: "#65A30D",
    icon: "banknote",
  },
  {
    code: "chef",
    name: "Chef",
    description:
      "Kitchen leadership with access to incoming orders, recipe management, and kitchen performance metrics.",
    isSystem: false,
    isDefault: true,
    priority: 300,
    color: "#D97706",
    icon: "chef-hat",
  },
  {
    code: "kitchen-staff",
    name: "Kitchen Staff",
    description:
      "Kitchen team members with access to incoming orders and ticket management. Cannot modify recipes or schedules.",
    isSystem: false,
    isDefault: true,
    priority: 200,
    color: "#A16207",
    icon: "utensils",
  },
  {
    code: "receptionist",
    name: "Receptionist",
    description:
      "Front-of-house staff managing reservations, walk-ins, and customer interactions. Cannot manage billing or staff.",
    isSystem: false,
    isDefault: true,
    priority: 250,
    color: "#0D9488",
    icon: "clipboard-list",
  },
  {
    code: "viewer",
    name: "Viewer",
    description:
      "Read-only operational access. Can view reports, dashboards, and reservation data but cannot create or modify any records.",
    isSystem: false,
    isDefault: true,
    priority: 100,
    color: "#6B7280",
    icon: "eye",
  },

  // ── Special Roles ─────────────────────────────────────────────────────────
  {
    code: "customer",
    name: "Customer",
    description:
      "Self-service diner account. Can manage own reservations, profile, and preferences.",
    isSystem: true,
    isDefault: false,
    priority: 0,
    color: "#6B7280",
    icon: "user",
  },
];

export async function seedRoles(prisma: PrismaClient): Promise<void> {
  for (const role of ROLES_TO_SEED) {
    const existing = await prisma.role.findFirst({
      where: {
        code: role.code,
        restaurantId: null,
      },
    });

    if (existing) {
      await prisma.role.update({
        where: { id: existing.id },
        data: {
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          isDefault: role.isDefault,
          priority: role.priority,
          color: role.color,
          icon: role.icon,
        },
      });
    } else {
      await prisma.role.create({ data: role });
    }
  }
}
