-- CreateTable: TableGroup
-- Temporary table grouping for merge/split operations
CREATE TABLE `table_groups` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `capacity` INT NOT NULL DEFAULT 0,
    `createdBy` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `releasedAt` DATETIME(3) NULL,
    PRIMARY KEY (`id`),
    INDEX `table_groups_restaurantId_idx` (`restaurantId`),
    INDEX `table_groups_restaurantId_status_idx` (`restaurantId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable: TableGroupMember
-- Individual table membership within a group
CREATE TABLE `table_group_members` (
    `id` CHAR(36) NOT NULL,
    `tableGroupId` CHAR(36) NOT NULL,
    `tableId` CHAR(36) NOT NULL,
    `order` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE INDEX `table_group_members_tableGroupId_tableId_key` (`tableGroupId`, `tableId`),
    INDEX `table_group_members_tableId_idx` (`tableId`),
    INDEX `table_group_members_tableGroupId_idx` (`tableGroupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints
ALTER TABLE `table_groups`
    ADD CONSTRAINT `table_groups_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE;

ALTER TABLE `table_group_members`
    ADD CONSTRAINT `table_group_members_tableGroupId_fkey` FOREIGN KEY (`tableGroupId`) REFERENCES `table_groups`(`id`) ON DELETE CASCADE;
