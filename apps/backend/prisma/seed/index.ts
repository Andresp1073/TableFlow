import { PrismaClient } from "@prisma/client";
import { seedRoles } from "./roles.seed";
import { seedPermissions } from "./permissions.seed";
import { seedRolePermissions } from "./role-permissions.seed";
import { seedOrganization } from "./organization.seed";
import { seedSettings } from "./settings.seed";
import { seedAdminUser } from "./admin-user.seed";

const prisma = new PrismaClient();

const SEEDERS: {
  name: string;
  fn: (prisma: PrismaClient) => Promise<void>;
}[] = [
  // Level 0 — No dependencies (no FK constraints)
  { name: "Permissions", fn: seedPermissions },
  { name: "Roles", fn: seedRoles },

  // Level 1 — Depends on permissions + roles
  { name: "RolePermissions", fn: seedRolePermissions },

  // Level 2 — No dependencies
  { name: "Organization", fn: seedOrganization },
  { name: "Settings", fn: seedSettings },

  // Level 3 — Depends on Organization + Role
  { name: "AdminUser", fn: seedAdminUser },
];

async function main(): Promise<void> {
  console.log("");

  for (const seeder of SEEDERS) {
    process.stdout.write(`  ${seeder.name.padEnd(25)} `);
    try {
      await seeder.fn(prisma);
      console.log("✔");
    } catch (error) {
      console.log("✘");
      throw error;
    }
  }

  console.log("");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
