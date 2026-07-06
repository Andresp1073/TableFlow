
-- Backfill code from existing name values
UPDATE `permissions` SET `code` = `name` WHERE `code` IS NULL;

-- Derive resource and action from dot-notation code
UPDATE `permissions` SET
    `resource` = SUBSTRING_INDEX(`code`, '.', 1),
    `action` = SUBSTRING_INDEX(`code`, '.', -1)
WHERE `resource` IS NULL;

-- Generate human-readable display name from resource + action
-- e.g. "users.create" -> "Create Users"
UPDATE `permissions` SET
    `name` = CONCAT(
        UCASE(LEFT(SUBSTRING_INDEX(`code`, '.', -1), 1)),
        SUBSTRING(SUBSTRING_INDEX(`code`, '.', -1), 2),
        ' ',
        UCASE(LEFT(SUBSTRING_INDEX(`code`, '.', 1), 1)),
        SUBSTRING(SUBSTRING_INDEX(`code`, '.', 1), 2)
    )
WHERE `name` IS NOT NULL;

-- Set updatedAt = createdAt for existing rows
UPDATE `permissions` SET `updatedAt` = `createdAt` WHERE `updatedAt` IS NULL;

-- Drop old unique constraint on `name`
DROP INDEX `permissions_name_key` ON `permissions`;

-- Make code NOT NULL and add unique constraint
ALTER TABLE `permissions` MODIFY COLUMN `code` VARCHAR(150) NOT NULL;
CREATE UNIQUE INDEX `permissions_code_key` ON `permissions`(`code`);

-- Make remaining new columns NOT NULL
ALTER TABLE `permissions` MODIFY COLUMN `name` VARCHAR(200) NOT NULL;
ALTER TABLE `permissions` MODIFY COLUMN `resource` VARCHAR(100) NOT NULL;
ALTER TABLE `permissions` MODIFY COLUMN `action` VARCHAR(100) NOT NULL;
ALTER TABLE `permissions` MODIFY COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- Add index on resource
CREATE INDEX `permissions_resource_idx` ON `permissions`(`resource`);
