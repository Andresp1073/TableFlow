-- Refactor TableGroup: add description, isActive; remove capacity (computed at runtime)
ALTER TABLE `table_groups`
    ADD COLUMN `description` TEXT NULL AFTER `name`,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true AFTER `status`,
    DROP COLUMN `capacity`;

-- Refactor TableGroupMember: rename order -> displayOrder, rename createdAt -> joinedAt
ALTER TABLE `table_group_members`
    CHANGE COLUMN `order` `displayOrder` INT NOT NULL DEFAULT 0,
    CHANGE COLUMN `createdAt` `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Add index for isActive filtering on table_groups
ALTER TABLE `table_groups`
    ADD INDEX `table_groups_restaurantId_isActive_idx` (`restaurantId`, `isActive`);
