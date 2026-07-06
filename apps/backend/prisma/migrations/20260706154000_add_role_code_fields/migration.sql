-- Add new columns (nullable initially for backfill)
ALTER TABLE `roles` ADD COLUMN `code` VARCHAR(100) NULL AFTER `id`,
    ADD COLUMN `restaurantId` CHAR(36) NULL AFTER `description`,
    ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false AFTER `isSystem`,
    ADD COLUMN `priority` INTEGER NOT NULL DEFAULT 0 AFTER `isDefault`,
    ADD COLUMN `color` VARCHAR(7) NULL AFTER `priority`,
    ADD COLUMN `icon` VARCHAR(50) NULL AFTER `color`,
    ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'active' AFTER `icon`;

-- Backfill code from existing name values (lowercase, hyphenated)
UPDATE `roles` SET `code` = LOWER(REPLACE(`name`, ' ', '-')) WHERE `code` IS NULL;

-- Drop old unique constraint on `name`
DROP INDEX `roles_name_key` ON `roles`;

-- Make code NOT NULL
ALTER TABLE `roles` MODIFY COLUMN `code` VARCHAR(100) NOT NULL;

-- Add unique constraint on [code, restaurantId]
CREATE UNIQUE INDEX `roles_code_restaurantId_key` ON `roles`(`code`, `restaurantId`);

-- Add index on restaurantId
CREATE INDEX `roles_restaurantId_idx` ON `roles`(`restaurantId`);

-- Add index on status
CREATE INDEX `roles_status_idx` ON `roles`(`status`);

-- Add foreign key for restaurantId
ALTER TABLE `roles` ADD CONSTRAINT `roles_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
