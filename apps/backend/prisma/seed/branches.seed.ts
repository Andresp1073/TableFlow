import { PrismaClient } from "@prisma/client";

interface BranchConfig {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  cuisineType: string;
}

function getBranchConfig(): BranchConfig {
  return {
    name: process.env.SEED_BRANCH_NAME || "Downtown",
    slug: process.env.SEED_BRANCH_SLUG || "downtown",
    email: process.env.SEED_BRANCH_EMAIL || "downtown@tableflow.io",
    phone: process.env.SEED_BRANCH_PHONE || "+1-555-0100",
    address: process.env.SEED_BRANCH_ADDRESS || "123 Main St, New York, NY 10001",
    timezone: process.env.SEED_BRANCH_TIMEZONE || "America/New_York",
    cuisineType: process.env.SEED_BRANCH_CUISINE || "american",
  };
}

export async function seedBranches(
  prisma: PrismaClient
): Promise<void> {
  const config = getBranchConfig();

  const orgSlug = process.env.SEED_ORG_SLUG;
  const org = orgSlug
    ? await prisma.organization.findUnique({ where: { slug: orgSlug } })
    : await prisma.organization.findFirst();
  if (!org) {
    throw new Error(
      "No organization found. Ensure organization is seeded before branches."
    );
  }

  const existing = await prisma.branch.findFirst({
    where: { organizationId: org.id, slug: config.slug },
  });

  if (existing) {
    await prisma.branch.update({
      where: { id: existing.id },
      data: {
        name: config.name,
        email: config.email,
        phone: config.phone,
        address: config.address,
        timezone: config.timezone,
        cuisineType: config.cuisineType,
        isOnlineReservationEnabled: true,
        isActive: true,
      },
    });
  } else {
    await prisma.branch.create({
      data: {
        organizationId: org.id,
        name: config.name,
        slug: config.slug,
        email: config.email,
        phone: config.phone,
        address: config.address,
        timezone: config.timezone,
        cuisineType: config.cuisineType,
        isOnlineReservationEnabled: true,
        isActive: true,
      },
    });
  }
}
