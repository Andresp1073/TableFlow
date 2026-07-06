const { PrismaClient } = require('@prisma/client');
async function main() {
  const p = new PrismaClient();
  await p.user.update({
    where: { email: 'admin@tableflow.io' },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
  console.log('Unlocked admin');
  await p.$disconnect();
}
main();
