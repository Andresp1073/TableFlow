-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `failedLoginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lastFailedLoginAt` DATETIME(3) NULL,
    `lockedAt` DATETIME(3) NULL,
    `lockedUntil` DATETIME(3) NULL,
    `lockReason` VARCHAR(255) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_organizationId_idx`(`organizationId`),
    INDEX `users_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `restaurantId` CHAR(36) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `color` VARCHAR(7) NULL,
    `icon` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `roles_restaurantId_idx`(`restaurantId`),
    INDEX `roles_status_idx`(`status`),
    UNIQUE INDEX `roles_code_restaurantId_key`(`code`, `restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `roleId` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NULL,
    `assignedBy` CHAR(36) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_roles_userId_idx`(`userId`),
    INDEX `user_roles_roleId_idx`(`roleId`),
    INDEX `user_roles_restaurantId_idx`(`restaurantId`),
    INDEX `user_roles_branchId_idx`(`branchId`),
    INDEX `user_roles_status_idx`(`status`),
    UNIQUE INDEX `user_roles_userId_roleId_restaurantId_key`(`userId`, `roleId`, `restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(150) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `module` VARCHAR(100) NOT NULL,
    `resource` VARCHAR(100) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `riskLevel` VARCHAR(20) NOT NULL DEFAULT 'low',
    `isSystem` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_module_idx`(`module`),
    INDEX `permissions_resource_idx`(`resource`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `id` CHAR(36) NOT NULL,
    `roleId` CHAR(36) NOT NULL,
    `permissionId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `role_permissions_roleId_idx`(`roleId`),
    INDEX `role_permissions_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_tokenHash_key`(`tokenHash`),
    INDEX `password_reset_tokens_userId_usedAt_expiresAt_idx`(`userId`, `usedAt`, `expiresAt`),
    INDEX `password_reset_tokens_tokenHash_idx`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verification_tokens` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(128) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email_verification_tokens_tokenHash_key`(`tokenHash`),
    INDEX `email_verification_tokens_userId_usedAt_expiresAt_idx`(`userId`, `usedAt`, `expiresAt`),
    INDEX `email_verification_tokens_tokenHash_idx`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `accessTokenJti` VARCHAR(255) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `familyId` CHAR(36) NOT NULL,
    `parentTokenId` CHAR(36) NULL,
    `rotatedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `reuseDetected` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_tokenHash_idx`(`tokenHash`),
    INDEX `refresh_tokens_accessTokenJti_idx`(`accessTokenJti`),
    INDEX `refresh_tokens_familyId_idx`(`familyId`),
    INDEX `refresh_tokens_parentTokenId_idx`(`parentTokenId`),
    INDEX `refresh_tokens_userId_isRevoked_expiresAt_idx`(`userId`, `isRevoked`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizations` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `legalName` VARCHAR(255) NULL,
    `taxId` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `website` VARCHAR(500) NULL,
    `address` TEXT NULL,
    `logoUrl` VARCHAR(500) NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
    `currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
    `language` VARCHAR(5) NOT NULL DEFAULT 'en',
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` CHAR(36) NULL,

    UNIQUE INDEX `organizations_slug_key`(`slug`),
    INDEX `organizations_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_settings` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
    `currency` CHAR(3) NOT NULL DEFAULT 'USD',
    `language` VARCHAR(10) NOT NULL DEFAULT 'en',
    `dateFormat` VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',
    `timeFormat` VARCHAR(20) NOT NULL DEFAULT 'HH:mm',
    `weekStartsOn` INTEGER NOT NULL DEFAULT 0,
    `taxPercentage` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `serviceChargePercentage` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `defaultReservationDuration` INTEGER NOT NULL DEFAULT 60,
    `reservationBufferMinutes` INTEGER NOT NULL DEFAULT 15,
    `allowWalkIns` BOOLEAN NOT NULL DEFAULT true,
    `autoConfirmReservations` BOOLEAN NOT NULL DEFAULT false,
    `maxReservationsPerCustomer` INTEGER NOT NULL DEFAULT 10,
    `reservationCancellationHours` INTEGER NOT NULL DEFAULT 24,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `restaurant_settings_restaurantId_key`(`restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `business_hours` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `business_hours_restaurantId_key`(`restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar_exceptions` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(30) NOT NULL,
    `date` DATE NOT NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `openTime` VARCHAR(5) NULL,
    `closeTime` VARCHAR(5) NULL,
    `allDay` BOOLEAN NOT NULL DEFAULT false,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `calendar_exceptions_restaurantId_date_idx`(`restaurantId`, `date`),
    INDEX `calendar_exceptions_date_idx`(`date`),
    UNIQUE INDEX `calendar_exceptions_restaurantId_date_type_key`(`restaurantId`, `date`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `opening_periods` (
    `id` CHAR(36) NOT NULL,
    `businessHoursId` CHAR(36) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `openTime` INTEGER NOT NULL,
    `closeTime` INTEGER NOT NULL,
    `order` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `opening_periods_businessHoursId_dayOfWeek_idx`(`businessHoursId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_assets` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `originalFilename` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `extension` VARCHAR(20) NOT NULL,
    `size` INTEGER NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `storageProvider` VARCHAR(50) NOT NULL,
    `storageKey` VARCHAR(500) NOT NULL,
    `publicUrl` VARCHAR(1000) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `restaurant_assets_restaurantId_type_idx`(`restaurantId`, `type`),
    INDEX `restaurant_assets_restaurantId_isPrimary_idx`(`restaurantId`, `isPrimary`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_policies` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `minPartySize` INTEGER NOT NULL DEFAULT 1,
    `maxPartySize` INTEGER NOT NULL DEFAULT 20,
    `defaultReservationDuration` INTEGER NOT NULL DEFAULT 60,
    `minAdvanceBookingMinutes` INTEGER NOT NULL DEFAULT 60,
    `maxAdvanceBookingDays` INTEGER NOT NULL DEFAULT 30,
    `cancellationDeadlineMinutes` INTEGER NOT NULL DEFAULT 1440,
    `modificationDeadlineMinutes` INTEGER NOT NULL DEFAULT 1440,
    `allowWalkIns` BOOLEAN NOT NULL DEFAULT true,
    `autoConfirmReservations` BOOLEAN NOT NULL DEFAULT false,
    `requireCustomerPhone` BOOLEAN NOT NULL DEFAULT false,
    `requireCustomerEmail` BOOLEAN NOT NULL DEFAULT true,
    `maxActiveReservationsPerCustomer` INTEGER NOT NULL DEFAULT 10,
    `gracePeriodMinutes` INTEGER NOT NULL DEFAULT 15,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reservation_policies_restaurantId_key`(`restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organization_settings` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,

    UNIQUE INDEX `organization_settings_organizationId_key_key`(`organizationId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
    `cuisineType` VARCHAR(100) NULL,
    `defaultDineDuration` INTEGER NOT NULL DEFAULT 90,
    `slotInterval` INTEGER NOT NULL DEFAULT 30,
    `maxPartySize` INTEGER NOT NULL DEFAULT 20,
    `advanceBookingDays` INTEGER NOT NULL DEFAULT 30,
    `minNoticeMinutes` INTEGER NOT NULL DEFAULT 60,
    `autoConfirm` BOOLEAN NOT NULL DEFAULT true,
    `isOnlineReservationEnabled` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` CHAR(36) NULL,

    INDEX `branches_organizationId_idx`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operating_hours` (
    `id` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `openTime` VARCHAR(5) NOT NULL,
    `closeTime` VARCHAR(5) NOT NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `operating_hours_branchId_dayOfWeek_key`(`branchId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holiday_hours` (
    `id` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,
    `date` DATE NOT NULL,
    `openTime` VARCHAR(5) NULL,
    `closeTime` VARCHAR(5) NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `reason` VARCHAR(255) NULL,

    INDEX `holiday_hours_date_idx`(`date`),
    UNIQUE INDEX `holiday_hours_branchId_date_key`(`branchId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,
    `employeeCode` VARCHAR(50) NULL,
    `position` VARCHAR(100) NOT NULL,
    `hiredAt` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `employees_employeeCode_key`(`employeeCode`),
    INDEX `employees_userId_idx`(`userId`),
    INDEX `employees_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `table_zones` (
    `id` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `table_zones_branchId_name_key`(`branchId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_tables` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,
    `diningAreaId` CHAR(36) NULL,
    `tableTypeId` CHAR(36) NULL,
    `zoneId` CHAR(36) NULL,
    `tableNumber` VARCHAR(10) NOT NULL,
    `name` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `minCapacity` INTEGER NOT NULL DEFAULT 1,
    `maxCapacity` INTEGER NOT NULL,
    `currentCapacity` INTEGER NOT NULL DEFAULT 0,
    `shape` VARCHAR(20) NOT NULL DEFAULT 'rectangle',
    `width` INTEGER NOT NULL DEFAULT 60,
    `height` INTEGER NOT NULL DEFAULT 60,
    `positionX` DOUBLE NULL,
    `positionY` DOUBLE NULL,
    `rotation` DOUBLE NULL,
    `qrIdentifier` VARCHAR(100) NULL,
    `isReservable` BOOLEAN NOT NULL DEFAULT true,
    `isAccessible` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(20) NOT NULL DEFAULT 'available',
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` CHAR(36) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `restaurant_tables_restaurantId_status_idx`(`restaurantId`, `status`),
    INDEX `restaurant_tables_restaurantId_diningAreaId_idx`(`restaurantId`, `diningAreaId`),
    INDEX `restaurant_tables_restaurantId_tableTypeId_idx`(`restaurantId`, `tableTypeId`),
    INDEX `restaurant_tables_restaurantId_isActive_idx`(`restaurantId`, `isActive`),
    INDEX `restaurant_tables_branchId_status_idx`(`branchId`, `status`),
    INDEX `restaurant_tables_branchId_tableNumber_idx`(`branchId`, `tableNumber`),
    INDEX `restaurant_tables_zoneId_idx`(`zoneId`),
    UNIQUE INDEX `restaurant_tables_restaurantId_tableNumber_key`(`restaurantId`, `tableNumber`),
    UNIQUE INDEX `restaurant_tables_restaurantId_qrIdentifier_key`(`restaurantId`, `qrIdentifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `table_types` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `description` TEXT NULL,
    `defaultCapacity` INTEGER NOT NULL DEFAULT 4,
    `minimumCapacity` INTEGER NOT NULL DEFAULT 1,
    `maximumCapacity` INTEGER NOT NULL DEFAULT 8,
    `shape` VARCHAR(20) NOT NULL DEFAULT 'rectangle',
    `isReservable` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `table_types_restaurantId_status_idx`(`restaurantId`, `status`),
    UNIQUE INDEX `table_types_restaurantId_name_key`(`restaurantId`, `name`),
    UNIQUE INDEX `table_types_restaurantId_code_key`(`restaurantId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dining_areas` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `description` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `isReservable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `dining_areas_restaurantId_status_idx`(`restaurantId`, `status`),
    UNIQUE INDEX `dining_areas_restaurantId_name_key`(`restaurantId`, `name`),
    UNIQUE INDEX `dining_areas_restaurantId_code_key`(`restaurantId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `table_groups` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `releasedAt` DATETIME(3) NULL,

    INDEX `table_groups_restaurantId_idx`(`restaurantId`),
    INDEX `table_groups_restaurantId_status_idx`(`restaurantId`, `status`),
    INDEX `table_groups_restaurantId_isActive_idx`(`restaurantId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `table_group_members` (
    `id` CHAR(36) NOT NULL,
    `tableGroupId` CHAR(36) NOT NULL,
    `tableId` CHAR(36) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `table_group_members_tableId_idx`(`tableId`),
    INDEX `table_group_members_tableGroupId_idx`(`tableGroupId`),
    UNIQUE INDEX `table_group_members_tableGroupId_tableId_key`(`tableGroupId`, `tableId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `totalVisits` INTEGER NOT NULL DEFAULT 0,
    `totalCancellations` INTEGER NOT NULL DEFAULT 0,
    `totalNoShows` INTEGER NOT NULL DEFAULT 0,
    `isVip` BOOLEAN NOT NULL DEFAULT false,
    `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `preferences` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` CHAR(36) NULL,

    INDEX `customers_organizationId_lastName_idx`(`organizationId`, `lastName`),
    INDEX `customers_organizationId_email_idx`(`organizationId`, `email`),
    INDEX `customers_organizationId_phone_idx`(`organizationId`, `phone`),
    INDEX `customers_organizationId_isFlagged_idx`(`organizationId`, `isFlagged`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservations` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,
    `customerId` CHAR(36) NULL,
    `confirmationCode` VARCHAR(20) NOT NULL,
    `partySize` INTEGER NOT NULL,
    `reservationDate` DATE NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `specialRequests` TEXT NULL,
    `notes` TEXT NULL,
    `walkIn` BOOLEAN NOT NULL DEFAULT false,
    `source` VARCHAR(20) NOT NULL DEFAULT 'staff',
    `tableGroupId` CHAR(36) NULL,
    `createdBy` CHAR(36) NOT NULL,
    `assignedTo` CHAR(36) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `cancelReason` VARCHAR(500) NULL,
    `noShowMarkedAt` DATETIME(3) NULL,
    `seatedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` CHAR(36) NULL,

    UNIQUE INDEX `reservations_confirmationCode_key`(`confirmationCode`),
    INDEX `reservations_branchId_reservationDate_status_idx`(`branchId`, `reservationDate`, `status`),
    INDEX `reservations_branchId_startTime_idx`(`branchId`, `startTime`),
    INDEX `reservations_customerId_idx`(`customerId`),
    INDEX `reservations_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `reservations_confirmationCode_idx`(`confirmationCode`),
    INDEX `reservations_tableGroupId_idx`(`tableGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_tables` (
    `reservationId` CHAR(36) NOT NULL,
    `tableId` CHAR(36) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reservation_tables_tableId_idx`(`tableId`),
    PRIMARY KEY (`reservationId`, `tableId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservation_status_history` (
    `id` CHAR(36) NOT NULL,
    `reservationId` CHAR(36) NOT NULL,
    `fromStatus` VARCHAR(20) NOT NULL,
    `toStatus` VARCHAR(20) NOT NULL,
    `changedBy` CHAR(36) NULL,
    `reason` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reservation_status_history_reservationId_createdAt_idx`(`reservationId`, `createdAt`),
    INDEX `reservation_status_history_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,
    `reservationId` CHAR(36) NULL,
    `type` VARCHAR(30) NOT NULL,
    `recipientEmail` VARCHAR(255) NULL,
    `recipientPhone` VARCHAR(20) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `sentAt` DATETIME(3) NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_reservationId_idx`(`reservationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NULL,
    `type` VARCHAR(30) NOT NULL,
    `subject` VARCHAR(500) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_templates_branchId_type_key`(`branchId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `settings_branchId_key_key`(`branchId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity` VARCHAR(50) NOT NULL,
    `entityId` CHAR(36) NOT NULL,
    `details` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `audit_logs_organizationId_entity_entityId_idx`(`organizationId`, `entity`, `entityId`),
    INDEX `audit_logs_organizationId_action_idx`(`organizationId`, `action`),
    INDEX `audit_logs_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_entries` (
    `id` CHAR(36) NOT NULL,
    `organizationId` CHAR(36) NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` CHAR(36) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `performedBy` CHAR(36) NULL,
    `restaurantId` CHAR(36) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `requestId` VARCHAR(100) NULL,
    `oldValues` JSON NULL,
    `newValues` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_entries_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `audit_entries_organizationId_module_idx`(`organizationId`, `module`),
    INDEX `audit_entries_organizationId_entityType_entityId_idx`(`organizationId`, `entityType`, `entityId`),
    INDEX `audit_entries_organizationId_action_idx`(`organizationId`, `action`),
    INDEX `audit_entries_performedBy_idx`(`performedBy`),
    INDEX `audit_entries_restaurantId_idx`(`restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_assignedBy_fkey` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_verification_tokens` ADD CONSTRAINT `email_verification_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_settings` ADD CONSTRAINT `restaurant_settings_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_hours` ADD CONSTRAINT `business_hours_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_exceptions` ADD CONSTRAINT `calendar_exceptions_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `opening_periods` ADD CONSTRAINT `opening_periods_businessHoursId_fkey` FOREIGN KEY (`businessHoursId`) REFERENCES `business_hours`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_assets` ADD CONSTRAINT `restaurant_assets_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_policies` ADD CONSTRAINT `reservation_policies_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organization_settings` ADD CONSTRAINT `organization_settings_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operating_hours` ADD CONSTRAINT `operating_hours_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `holiday_hours` ADD CONSTRAINT `holiday_hours_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table_zones` ADD CONSTRAINT `table_zones_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_tables` ADD CONSTRAINT `restaurant_tables_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_tables` ADD CONSTRAINT `restaurant_tables_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_tables` ADD CONSTRAINT `restaurant_tables_diningAreaId_fkey` FOREIGN KEY (`diningAreaId`) REFERENCES `dining_areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_tables` ADD CONSTRAINT `restaurant_tables_tableTypeId_fkey` FOREIGN KEY (`tableTypeId`) REFERENCES `table_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_tables` ADD CONSTRAINT `restaurant_tables_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `table_zones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table_types` ADD CONSTRAINT `table_types_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dining_areas` ADD CONSTRAINT `dining_areas_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table_groups` ADD CONSTRAINT `table_groups_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `table_group_members` ADD CONSTRAINT `table_group_members_tableGroupId_fkey` FOREIGN KEY (`tableGroupId`) REFERENCES `table_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `customers_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_updatedBy_fkey` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_tables` ADD CONSTRAINT `reservation_tables_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `reservations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_tables` ADD CONSTRAINT `reservation_tables_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `restaurant_tables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reservation_status_history` ADD CONSTRAINT `reservation_status_history_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `reservations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `reservations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_templates` ADD CONSTRAINT `notification_templates_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settings` ADD CONSTRAINT `settings_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

