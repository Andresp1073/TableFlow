import { PrismaClient } from '@prisma/client';
async function main() {
  const p = new PrismaClient();
  const user = await p.user.findUnique({
    where: { email: 'admin@tableflow.io' },
    select: { email: true, failedLoginAttempts: true, lockedUntil: true, passwordHash: true },
  });
  console.log(JSON.stringify(user, null, 2));
  await p.$disconnect();
}
main();
