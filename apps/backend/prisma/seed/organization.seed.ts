import { PrismaClient } from "@prisma/client";

interface OrgConfig {
  name: string;
  slug: string;
  email: string;
}

function getOrgConfig(): OrgConfig {
  const name = process.env.SEED_ORG_NAME;
  const slug = process.env.SEED_ORG_SLUG;
  const email = process.env.SEED_ORG_EMAIL;

  if (!name || !slug || !email) {
    throw new Error(
      "Missing organization seed environment variables. Ensure SEED_ORG_NAME, SEED_ORG_SLUG, " +
        "and SEED_ORG_EMAIL are set."
    );
  }

  return { name, slug, email };
}

export async function seedOrganization(
  prisma: PrismaClient
): Promise<void> {
  const config = getOrgConfig();

  await prisma.organization.upsert({
    where: { slug: config.slug },
    update: {},
    create: {
      name: config.name,
      slug: config.slug,
      email: config.email,
      timezone: "UTC",
    },
  });
}
