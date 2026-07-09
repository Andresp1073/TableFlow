CREATE TABLE IF NOT EXISTS `restaurant_assets` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `originalFilename` VARCHAR(500) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `extension` VARCHAR(20) NOT NULL,
    `size` INT NOT NULL,
    `width` INT NULL,
    `height` INT NULL,
    `storageProvider` VARCHAR(50) NOT NULL,
    `storageKey` VARCHAR(500) NOT NULL,
    `publicUrl` VARCHAR(1000) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL,

    INDEX `restaurant_assets_restaurantId_type_idx` (`restaurantId`, `type`),
    INDEX `restaurant_assets_restaurantId_isPrimary_idx` (`restaurantId`, `isPrimary`),
    INDEX `restaurant_assets_type_idx` (`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `restaurant_assets` ADD CONSTRAINT `restaurant_assets_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE;
