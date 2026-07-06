-- Add id column (nullable initially for backfill)
ALTER TABLE `role_permissions` ADD COLUMN `id` CHAR(36) NULL FIRST;

-- Backfill UUID for every existing row
UPDATE `role_permissions` SET `id` = UUID();

-- Make id NOT NULL
ALTER TABLE `role_permissions` MODIFY COLUMN `id` CHAR(36) NOT NULL;

-- Add createdAt column with default for existing rows
ALTER TABLE `role_permissions` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `permissionId`;

-- Add new indexes BEFORE dropping old PK so FKs remain satisfied
CREATE INDEX `role_permissions_roleId_idx` ON `role_permissions`(`roleId`);
CREATE INDEX `role_permissions_permissionId_idx` ON `role_permissions`(`permissionId`);

-- Add unique constraint on (roleId, permissionId) to prevent duplicates
CREATE UNIQUE INDEX `role_permissions_roleId_permissionId_key` ON `role_permissions`(`roleId`, `permissionId`);

-- Drop old composite primary key (FKs are now covered by new indexes)
ALTER TABLE `role_permissions` DROP PRIMARY KEY;

-- Make id the new primary key
ALTER TABLE `role_permissions` ADD PRIMARY KEY (`id`);
