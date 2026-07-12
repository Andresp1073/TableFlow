-- AlterTable: Add new columns to restaurant_tables for Physical Tables module
ALTER TABLE `restaurant_tables`
    ADD COLUMN `restaurantId` CHAR(36) NOT NULL,
    ADD COLUMN `diningAreaId` CHAR(36) NULL,
    ADD COLUMN `tableTypeId` CHAR(36) NULL,
    ADD COLUMN `name` VARCHAR(100) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `currentCapacity` INT NOT NULL DEFAULT 0,
    ADD COLUMN `rotation` FLOAT NULL,
    ADD COLUMN `qrIdentifier` VARCHAR(100) NULL,
    ADD COLUMN `isReservable` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isAccessible` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `metadata` JSON NULL,
    ADD INDEX `restaurant_tables_restaurantId_status_idx` (`restaurantId`, `status`),
    ADD INDEX `restaurant_tables_restaurantId_diningAreaId_idx` (`restaurantId`, `diningAreaId`),
    ADD INDEX `restaurant_tables_restaurantId_tableTypeId_idx` (`restaurantId`, `tableTypeId`),
    ADD INDEX `restaurant_tables_restaurantId_isActive_idx` (`restaurantId`, `isActive`),
    ADD UNIQUE INDEX `restaurant_tables_restaurantId_tableNumber_key` (`restaurantId`, `tableNumber`),
    ADD UNIQUE INDEX `restaurant_tables_restaurantId_qrIdentifier_key` (`restaurantId`, `qrIdentifier`);

-- Set currentCapacity to maxCapacity for existing rows
UPDATE `restaurant_tables` SET `currentCapacity` = `maxCapacity` WHERE `currentCapacity` = 0;

-- Add foreign key constraints for new columns
ALTER TABLE `restaurant_tables`
    ADD CONSTRAINT `restaurant_tables_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `restaurant_tables_diningAreaId_fkey` FOREIGN KEY (`diningAreaId`) REFERENCES `dining_areas`(`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `restaurant_tables_tableTypeId_fkey` FOREIGN KEY (`tableTypeId`) REFERENCES `table_types`(`id`) ON DELETE SET NULL;
