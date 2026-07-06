import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const p = new PrismaClient();
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  await p.user.update({
    where: { email: 'admin@tableflow.io' },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
  console.log('Admin password reset to Admin123!');
  await p.$disconnect();
}
main();
