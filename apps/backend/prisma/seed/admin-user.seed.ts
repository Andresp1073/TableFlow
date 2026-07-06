import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

interface AdminConfig {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

function getAdminConfig(): AdminConfig {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const firstName = process.env.SEED_ADMIN_FIRST_NAME;
  const lastName = process.env.SEED_ADMIN_LAST_NAME;

  if (!email || !password || !firstName || !lastName) {
    throw new Error(
      "Missing admin seed environment variables. Ensure SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, " +
        "SEED_ADMIN_FIRST_NAME, and SEED_ADMIN_LAST_NAME are set."
    );
  }

  if (password.length < 8) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be at least 8 characters long."
    );
  }

  return { email, password, firstName, lastName };
}

export async function seedAdminUser(
  prisma: PrismaClient
): Promise<void> {
  const config = getAdminConfig();

  const passwordHash = await bcrypt.hash(config.password, 12);

  const sysAdminRole = await prisma.role.findFirstOrThrow({
    where: { code: "super-admin", restaurantId: null },
  });

  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error(
      "No organization found. Ensure organizations are seeded before admin user."
    );
  }

  const user = await prisma.user.upsert({
    where: { email: config.email },
    update: {
      firstName: config.firstName,
      lastName: config.lastName,
      isActive: true,
      isVerified: true,
    },
    create: {
      organizationId: org.id,
      email: config.email,
      passwordHash,
      firstName: config.firstName,
      lastName: config.lastName,
      isActive: true,
      isVerified: true,
    },
  });

  const existingAssignment = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: sysAdminRole.id,
      branchId: null,
    },
  });

  if (!existingAssignment) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: sysAdminRole.id,
        branchId: null,
      },
    });
  }
}
