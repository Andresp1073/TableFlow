import { PrismaClient } from "@prisma/client";

interface SettingSeed {
  key: string;
  value: Record<string, unknown>;
}

const SYSTEM_SETTINGS: SettingSeed[] = [
  {
    key: "system.config",
    value: {
      applicationName: "TableFlow",
      applicationVersion: "1.0.0",
      defaultTimezone: "UTC",
      defaultLanguage: "en",
      defaultCurrency: "USD",
      dateFormat: "YYYY-MM-DD",
      timeFormat: "HH:mm",
      defaultCountry: "US",
    },
  },
  {
    key: "reservation.defaults",
    value: {
      defaultDineDuration: 90,
      defaultSlotInterval: 30,
      defaultMaxPartySize: 20,
      defaultAdvanceBookingDays: 30,
      defaultMinNoticeMinutes: 60,
      defaultAutoConfirm: true,
    },
  },
  {
    key: "business.defaults",
    value: {
      operatingHours: {
        monday: { open: "09:00", close: "23:00" },
        tuesday: { open: "09:00", close: "23:00" },
        wednesday: { open: "09:00", close: "23:00" },
        thursday: { open: "09:00", close: "23:00" },
        friday: { open: "09:00", close: "00:00" },
        saturday: { open: "09:00", close: "00:00" },
        sunday: { open: "10:00", close: "22:00" },
      },
      holidays: [],
    },
  },
  {
    key: "notifications.defaults",
    value: {
      enabled: true,
      reminderTimingMinutes: [1440, 120, 60],
      confirmationEnabled: true,
      cancellationEnabled: true,
      modificationEnabled: true,
      smsEnabled: false,
      emailEnabled: true,
    },
  },
  {
    key: "guest.preferences",
    value: {
      allowGuestRegistration: true,
      requirePhoneNumber: true,
      maxFutureBookingsPerCustomer: 5,
      enableWaitlist: false,
      enableReviews: false,
    },
  },
  {
    key: "security.policies",
    value: {
      maxFailedLoginAttempts: 5,
      lockoutDurationMinutes: 30,
      passwordMinLength: 12,
      passwordRequireSpecialChar: true,
      passwordRequireNumber: true,
      passwordRequireUppercase: true,
      passwordHistoryCount: 5,
      sessionTimeoutMinutes: 480,
      maxActiveSessionsPerUser: 3,
    },
  },
  {
    key: "audit.retention",
    value: {
      retentionDays: 365,
      sensitiveRetentionDays: 1825,
      archiveAfterDays: 90,
      exportFormat: "json",
    },
  },
];

export async function seedSettings(
  prisma: PrismaClient
): Promise<void> {
  for (const setting of SYSTEM_SETTINGS) {
    const key = `global.${setting.key}`;
    const value = JSON.parse(JSON.stringify(setting.value));

    const existing = await prisma.setting.findFirst({
      where: { branchId: null, key },
    });

    if (existing) {
      await prisma.setting.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      await prisma.setting.create({
        data: { branchId: null, key, value },
      });
    }
  }
}
