-- Add missing columns to user_roles
-- restaurantId (required FK)
ALTER TABLE `user_roles` ADD COLUMN `restaurantId` CHAR(36) NULL AFTER `roleId`;

-- Backfill restaurantId using the user's organizationId
UPDATE `user_roles` ur
  JOIN `users` u ON u.id = ur.userId
  SET ur.`restaurantId` = u.`organizationId`;

-- Make restaurantId NOT NULL
ALTER TABLE `user_roles` MODIFY COLUMN `restaurantId` CHAR(36) NOT NULL;

-- assignedBy (required FK to users)
ALTER TABLE `user_roles` ADD COLUMN `assignedBy` CHAR(36) NULL AFTER `branchId`;

-- Backfill assignedBy using the user's own id (self-assigned legacy rows)
UPDATE `user_roles` SET `assignedBy` = `userId`;

-- Make assignedBy NOT NULL
ALTER TABLE `user_roles` MODIFY COLUMN `assignedBy` CHAR(36) NOT NULL;

-- assignedAt
ALTER TABLE `user_roles` ADD COLUMN `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `assignedBy`;

-- expiresAt
ALTER TABLE `user_roles` ADD COLUMN `expiresAt` DATETIME(3) NULL AFTER `assignedAt`;

-- status
ALTER TABLE `user_roles` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'active' AFTER `expiresAt`;

-- createdAt
ALTER TABLE `user_roles` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `status`;

-- updatedAt
ALTER TABLE `user_roles` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER `createdAt`;

-- Drop old unique constraint on (userId, roleId, branchId)
-- Ensure FK on branchId has an index before dropping the composite covering index
SET @exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_roles' AND INDEX_NAME = 'user_roles_branchId_idx');
SET @sql = IF(@exists = 0, 'CREATE INDEX `user_roles_branchId_idx` ON `user_roles`(`branchId`)', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
DROP INDEX `user_roles_userId_roleId_branchId_key` ON `user_roles`;

-- Add new unique constraint on (userId, roleId, restaurantId)
CREATE UNIQUE INDEX `user_roles_userId_roleId_restaurantId_key` ON `user_roles`(`userId`, `roleId`, `restaurantId`);

-- Add index on restaurantId
CREATE INDEX `user_roles_restaurantId_idx` ON `user_roles`(`restaurantId`);

-- Add index on status
CREATE INDEX `user_roles_status_idx` ON `user_roles`(`status`);

-- Add index on userId (separate from composite)
CREATE INDEX `user_roles_userId_idx` ON `user_roles`(`userId`);

-- Add foreign keys
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_assignedBy_fkey` FOREIGN KEY (`assignedBy`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
