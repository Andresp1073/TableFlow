import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'admin@tableflow.io' } });
  if (!user) { console.log('user not found'); return; }
  console.log('user:', user.id, 'orgId:', user.organizationId);

  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id, status: 'active' },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  const permissionSet = new Set<string>();
  for (const ur of userRoles) {
    if (ur.role.restaurantId !== null && ur.role.restaurantId !== user.organizationId) continue;
    for (const rp of ur.role.rolePermissions) {
      permissionSet.add(rp.permission.code);
    }
  }

  console.log('resolved permissions count:', permissionSet.size);
  console.log('has reservations.read:', permissionSet.has('reservations.read'));
  console.log('has tables.read:', permissionSet.has('tables.read'));

  // Also check userRoles
  console.log('userRoles count:', userRoles.length);
  for (const ur of userRoles) {
    console.log('  role:', ur.role.code, 'status:', ur.status, 'restaurantId:', ur.restaurantId, 'role.restaurantId:', ur.role.restaurantId);
  }

  // check super-admin role permissions
  const role = await prisma.role.findFirst({ where: { code: 'super-admin', restaurantId: null } });
  if (role) {
    const rp = await prisma.rolePermission.count({ where: { roleId: role.id } });
    console.log('super-admin role id:', role.id, 'permission count:', rp);
  }

  await prisma.$disconnect();
}
main().catch(console.error);
