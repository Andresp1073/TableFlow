-- CreateTable: table_types
CREATE TABLE `table_types` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `description` TEXT NULL,
    `defaultCapacity` INT NOT NULL DEFAULT 4,
    `minimumCapacity` INT NOT NULL DEFAULT 1,
    `maximumCapacity` INT NOT NULL DEFAULT 8,
    `shape` VARCHAR(20) NOT NULL DEFAULT 'rectangle',
    `isReservable` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INT NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `table_types_restaurantId_name_key` (`restaurantId`, `name`),
    UNIQUE INDEX `table_types_restaurantId_code_key` (`restaurantId`, `code`),
    INDEX `table_types_restaurantId_status_idx` (`restaurantId`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
