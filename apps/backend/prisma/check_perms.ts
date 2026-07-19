import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const role = await prisma.role.findFirst({ where: { code: 'super-admin', restaurantId: null } });
  if (!role) { console.log('super-admin role NOT FOUND'); return; }
  console.log('super-admin role:', role.id, role.code);
  const rp = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
    include: { permission: true }
  });
  console.log('role-permissions count:', rp.length);
  const rpCodes = rp.map(r => r.permission.code);
  console.log('has reservations.read:', rpCodes.includes('reservations.read'));
  console.log('has tables.read:', rpCodes.includes('tables.read'));
  const user = await prisma.user.findFirst({ where: { email: 'admin@tableflow.io' } });
  if (!user) { console.log('admin user NOT FOUND'); return; }
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id, status: 'active' },
    include: { role: true }
  });
  console.log('userRoles count:', userRoles.length);
  for (const ur of userRoles) {
    console.log('  role:', ur.role.code, 'status:', ur.status, 'restaurantId:', ur.restaurantId);
  }
  await prisma.$disconnect();
}
main().catch(console.error);
