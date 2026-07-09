-- CreateTable: audit_entries
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

    PRIMARY KEY (`id`),
    INDEX `audit_entries_organizationId_createdAt_idx` (`organizationId`, `createdAt`),
    INDEX `audit_entries_organizationId_module_idx` (`organizationId`, `module`),
    INDEX `audit_entries_organizationId_entityType_entityId_idx` (`organizationId`, `entityType`, `entityId`),
    INDEX `audit_entries_organizationId_action_idx` (`organizationId`, `action`),
    INDEX `audit_entries_performedBy_idx` (`performedBy`),
    INDEX `audit_entries_restaurantId_idx` (`restaurantId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
