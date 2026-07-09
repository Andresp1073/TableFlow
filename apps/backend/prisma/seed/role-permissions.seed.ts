import { PrismaClient } from "@prisma/client";

type PermissionName = string;

const ROLE_PERMISSIONS: Record<string, PermissionName[]> = {
  "super-admin": [
    // Auth
    "auth.register",
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.create",
    "users.read",
    "users.update",
    "users.delete",
    "users.disable",
    "users.enable",
    "users.list",
    "users.changeRole",
    "users.invite",
    // Roles
    "roles.create",
    "roles.read",
    "roles.update",
    "roles.delete",
    "roles.list",
    "roles.assign",
    // Restaurants
    "restaurants.create",
    "restaurants.read",
    "restaurants.update",
    "restaurants.list",
    "restaurants.activate",
    "restaurants.suspend",
    "restaurants.activate",
    "restaurants.suspend",
    "restaurants.archive",
    "restaurants.settings.read",
    "restaurants.settings.update",
    "restaurants.reservation-policy.read",
    "restaurants.reservation-policy.update",
    "restaurants.business-hours.read",
    "restaurants.business-hours.update",
    "restaurants.calendar-exceptions.read",
    "restaurants.calendar-exceptions.create",
    "restaurants.calendar-exceptions.update",
    "restaurants.calendar-exceptions.delete",
    // Branches
    "branches.create",
    "branches.read",
    "branches.update",
    "branches.delete",
    "branches.list",
    "branches.configureHours",
    "branches.configurePolicies",
    // Tables
    "tables.create",
    "tables.read",
    "tables.update",
    "tables.delete",
    "tables.list",
    "tables.assign",
    "tables.release",
    "tables.updateStatus",
    "tables.merge",
    "tables.split",
    "tables.disable",
    "tables.configureLayout",
    // Reservations
    "reservations.create",
    "reservations.read",
    "reservations.update",
    "reservations.delete",
    "reservations.cancel",
    "reservations.confirm",
    "reservations.checkIn",
    "reservations.checkOut",
    "reservations.markNoShow",
    "reservations.list",
    "reservations.searchAvailability",
    "reservations.autoAssign",
    "reservations.manageRecurring",
    "reservations.addNotes",
    "reservations.manageWalkIn",
    "reservations.overrideBlock",
    // Customers
    "customers.create",
    "customers.read",
    "customers.update",
    "customers.delete",
    "customers.list",
    "customers.merge",
    "customers.flag",
    "customers.addNotes",
    "customers.export",
    // Notifications
    "notifications.send",
    "notifications.viewLog",
    "notifications.configureTemplates",
    "notifications.configurePreferences",
    "notifications.retry",
    // Reports
    "reports.view",
    "reports.export",
    "reports.viewDashboard",
    "reports.configureMetrics",
    "reports.schedule",
    // Dashboard
    "dashboard.view",
    "dashboard.customize",
    // Settings
    "settings.view",
    "settings.updateGeneral",
    "settings.updateReservationPolicies",
    "settings.updateNotificationPreferences",
    "settings.updateBusinessHours",
    "settings.manageIntegrations",
    // Audit
    "audit.read",
    "audit.readSensitive",
    "audit.export",
    "audit.configureRetention",
    // Organizations
    "organizations.create",
    "organizations.read",
    "organizations.update",
    "organizations.delete",
    "organizations.list",
    "organizations.manageSubscription",
    // System
    "system.viewHealth",
    "system.manageBackup",
    "system.manageRecovery",
    "system.viewLogs",
    "system.configureGlobal",
  ],

  "restaurant-owner": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.create",
    "users.read",
    "users.update",
    "users.delete",
    "users.disable",
    "users.enable",
    "users.list",
    "users.changeRole",
    "users.invite",
    // Roles
    "roles.read",
    "roles.list",
    "roles.assign",
    // Restaurants
    "restaurants.read",
    "restaurants.update",
    "restaurants.list",
    "restaurants.settings.read",
    "restaurants.settings.update",
    "restaurants.reservation-policy.read",
    "restaurants.reservation-policy.update",
    "restaurants.business-hours.read",
    "restaurants.business-hours.update",
    "restaurants.calendar-exceptions.read",
    "restaurants.calendar-exceptions.create",
    "restaurants.calendar-exceptions.update",
    "restaurants.calendar-exceptions.delete",
    // Branches
    "branches.create",
    "branches.read",
    "branches.update",
    "branches.list",
    "branches.configureHours",
    "branches.configurePolicies",
    // Tables
    "tables.create",
    "tables.read",
    "tables.update",
    "tables.delete",
    "tables.list",
    "tables.assign",
    "tables.release",
    "tables.updateStatus",
    "tables.merge",
    "tables.split",
    "tables.disable",
    "tables.configureLayout",
    // Reservations
    "reservations.create",
    "reservations.read",
    "reservations.update",
    "reservations.delete",
    "reservations.cancel",
    "reservations.confirm",
    "reservations.checkIn",
    "reservations.checkOut",
    "reservations.markNoShow",
    "reservations.list",
    "reservations.searchAvailability",
    "reservations.autoAssign",
    "reservations.manageRecurring",
    "reservations.addNotes",
    "reservations.manageWalkIn",
    "reservations.overrideBlock",
    // Customers
    "customers.create",
    "customers.read",
    "customers.update",
    "customers.delete",
    "customers.list",
    "customers.merge",
    "customers.flag",
    "customers.addNotes",
    "customers.export",
    // Notifications
    "notifications.send",
    "notifications.viewLog",
    "notifications.configureTemplates",
    "notifications.configurePreferences",
    "notifications.retry",
    // Reports
    "reports.view",
    "reports.export",
    "reports.viewDashboard",
    "reports.configureMetrics",
    "reports.schedule",
    // Dashboard
    "dashboard.view",
    "dashboard.customize",
    // Settings
    "settings.view",
    "settings.updateGeneral",
    "settings.updateReservationPolicies",
    "settings.updateNotificationPreferences",
    "settings.updateBusinessHours",
    "settings.manageIntegrations",
    // Audit
    "audit.read",
    "audit.export",
    // Organizations
    "organizations.read",
    "organizations.update",
    "organizations.list",
    "organizations.manageSubscription",
    // System
    "system.viewHealth",
  ],

  "restaurant-manager": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.read",
    "users.update",
    "users.list",
    // Roles
    "roles.read",
    "roles.list",
    // Restaurants
    "restaurants.read",
    "restaurants.list",
    // Branches
    "branches.read",
    "branches.list",
    // Tables
    "tables.create",
    "tables.read",
    "tables.update",
    "tables.delete",
    "tables.list",
    "tables.assign",
    "tables.release",
    "tables.updateStatus",
    "tables.merge",
    "tables.split",
    "tables.disable",
    // Reservations
    "reservations.create",
    "reservations.read",
    "reservations.update",
    "reservations.delete",
    "reservations.cancel",
    "reservations.confirm",
    "reservations.checkIn",
    "reservations.checkOut",
    "reservations.markNoShow",
    "reservations.list",
    "reservations.searchAvailability",
    "reservations.autoAssign",
    "reservations.manageRecurring",
    "reservations.addNotes",
    "reservations.manageWalkIn",
    "reservations.overrideBlock",
    // Customers
    "customers.create",
    "customers.read",
    "customers.update",
    "customers.delete",
    "customers.list",
    "customers.flag",
    "customers.addNotes",
    "customers.export",
    // Notifications
    "notifications.send",
    "notifications.viewLog",
    "notifications.retry",
    // Reports
    "reports.view",
    "reports.export",
    "reports.viewDashboard",
    // Dashboard
    "dashboard.view",
    "dashboard.customize",
    // Settings
    "settings.view",
    // Audit
    "audit.read",
  ],

  "receptionist": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.read",
    "users.update",
    "users.list",
    // Branches
    "branches.read",
    "branches.list",
    // Tables
    "tables.read",
    "tables.list",
    "tables.assign",
    "tables.release",
    "tables.updateStatus",
    // Reservations
    "reservations.create",
    "reservations.read",
    "reservations.update",
    "reservations.cancel",
    "reservations.confirm",
    "reservations.checkIn",
    "reservations.checkOut",
    "reservations.markNoShow",
    "reservations.list",
    "reservations.searchAvailability",
    "reservations.autoAssign",
    "reservations.manageRecurring",
    "reservations.addNotes",
    "reservations.manageWalkIn",
    // Customers
    "customers.create",
    "customers.read",
    "customers.update",
    "customers.list",
    "customers.addNotes",
    // Notifications
    "notifications.viewLog",
    // Reports
    "reports.view",
    "reports.viewDashboard",
    // Dashboard
    "dashboard.view",
    // Settings
    "settings.view",
  ],

  "waiter": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.read",
    "users.update",
    "users.list",
    // Restaurants
    "restaurants.read",
    "restaurants.list",
    // Branches
    "branches.read",
    "branches.list",
    // Tables
    "tables.read",
    "tables.list",
    "tables.updateStatus",
    // Reservations
    "reservations.read",
    "reservations.list",
    "reservations.searchAvailability",
    "reservations.checkOut",
    // Customers
    "customers.read",
    // Dashboard
    "dashboard.view",
  ],

  "customer": [
    // Auth
    "auth.register",
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Restaurants
    "restaurants.read",
    "restaurants.list",
    // Branches
    "branches.read",
    "branches.list",
    // Tables
    "tables.list",
    // Reservations
    "reservations.create",
    "reservations.read",
    "reservations.update",
    "reservations.cancel",
    "reservations.list",
    "reservations.searchAvailability",
    // Customers
    "customers.create",
    "customers.read",
    "customers.update",
  ],

  "platform-admin": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.read",
    "users.list",
    "users.disable",
    "users.enable",
    // Roles
    "roles.read",
    "roles.list",
    // Restaurants
    "restaurants.create",
    "restaurants.read",
    "restaurants.update",
    "restaurants.list",
    // Branches
    "branches.read",
    "branches.list",
    // Notifications
    "notifications.viewLog",
    "notifications.retry",
    // Reports
    "reports.view",
    "reports.viewDashboard",
    "reports.schedule",
    // Dashboard
    "dashboard.view",
    // Settings
    "settings.view",
    // Audit
    "audit.read",
    "audit.export",
    // Organizations
    "organizations.read",
    "organizations.list",
    "organizations.manageSubscription",
    // System
    "system.viewHealth",
    "system.viewLogs",
  ],

  "support": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.read",
    "users.list",
    // Roles
    "roles.read",
    "roles.list",
    // Restaurants
    "restaurants.read",
    "restaurants.list",
    // Branches
    "branches.read",
    "branches.list",
    // Tables
    "tables.read",
    "tables.list",
    // Reservations
    "reservations.read",
    "reservations.list",
    "reservations.searchAvailability",
    // Customers
    "customers.read",
    "customers.list",
    // Notifications
    "notifications.viewLog",
    // Reports
    "reports.view",
    "reports.viewDashboard",
    // Dashboard
    "dashboard.view",
    // Settings
    "settings.view",
    // Audit
    "audit.read",
    // Organizations
    "organizations.read",
    "organizations.list",
    // System
    "system.viewHealth",
    "system.viewLogs",
  ],

  "host": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.read",
    "users.list",
    // Restaurants
    "restaurants.read",
    "restaurants.list",
    // Branches
    "branches.read",
    "branches.list",
    // Tables
    "tables.read",
    "tables.list",
    "tables.assign",
    "tables.updateStatus",
    // Reservations
    "reservations.create",
    "reservations.read",
    "reservations.update",
    "reservations.cancel",
    "reservations.confirm",
    "reservations.checkIn",
    "reservations.list",
    "reservations.searchAvailability",
    "reservations.manageWalkIn",
    "reservations.addNotes",
    // Customers
    "customers.create",
    "customers.read",
    "customers.update",
    "customers.list",
    "customers.addNotes",
    // Dashboard
    "dashboard.view",
    // Settings
    "settings.view",
  ],

  "cashier": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.read",
    // Tables
    "tables.read",
    "tables.list",
    // Reservations
    "reservations.read",
    "reservations.list",
    "reservations.checkOut",
    // Customers
    "customers.read",
    // Reports
    "reports.view",
    "reports.viewDashboard",
    // Dashboard
    "dashboard.view",
    // Settings
    "settings.view",
  ],

  "chef": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.read",
    // Tables
    "tables.read",
    "tables.list",
    // Reservations
    "reservations.read",
    "reservations.list",
    // Customers
    "customers.read",
    // Dashboard
    "dashboard.view",
  ],

  "kitchen-staff": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Tables
    "tables.read",
    "tables.list",
    // Reservations
    "reservations.read",
    "reservations.list",
    // Dashboard
    "dashboard.view",
  ],

  "viewer": [
    // Auth
    "auth.login",
    "auth.logout",
    "auth.refresh",
    "auth.resetPassword",
    "auth.changePassword",
    // Users
    "users.read",
    // Restaurants
    "restaurants.read",
    "restaurants.list",
    // Branches
    "branches.read",
    "branches.list",
    // Tables
    "tables.read",
    "tables.list",
    // Reservations
    "reservations.read",
    "reservations.list",
    "reservations.searchAvailability",
    // Customers
    "customers.read",
    "customers.list",
    // Reports
    "reports.view",
    "reports.viewDashboard",
    // Dashboard
    "dashboard.view",
    // Settings
    "settings.view",
  ],
};

export async function seedRolePermissions(
  prisma: PrismaClient
): Promise<void> {
  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();

  const permissionMap = new Map(
    permissions.map((p) => [p.code, p.id])
  );
  const roleMap = new Map(roles.map((r) => [r.code, r.id]));

  for (const [roleName, permissionNames] of Object.entries(
    ROLE_PERMISSIONS
  )) {
    const roleId = roleMap.get(roleName);
    if (!roleId) {
      console.warn(`Role not found: ${roleName}`);
      continue;
    }

    for (const permName of permissionNames) {
      const permissionId = permissionMap.get(permName);
      if (!permissionId) {
        console.warn(`Permission not found: ${permName}`);
        continue;
      }

      const roleIdStr = roleId;
      const permissionIdStr = permissionId;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleIdStr,
            permissionId: permissionIdStr,
          },
        },
        update: {},
        create: {
          roleId: roleIdStr,
          permissionId: permissionIdStr,
        },
      });
    }
  }
}
