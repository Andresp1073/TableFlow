-- Create BusinessHours table
CREATE TABLE `business_hours` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL,

    UNIQUE INDEX `business_hours_restaurantId_key` (`restaurantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create OpeningPeriod table
CREATE TABLE `opening_periods` (
    `id` CHAR(36) NOT NULL,
    `businessHoursId` CHAR(36) NOT NULL,
    `dayOfWeek` INT NOT NULL,
    `openTime` INT NOT NULL,
    `closeTime` INT NOT NULL,
    `order` INT NOT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX `opening_periods_businessHoursId_dayOfWeek_idx` (`businessHoursId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key constraints
ALTER TABLE `business_hours` ADD CONSTRAINT `business_hours_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE;

ALTER TABLE `opening_periods` ADD CONSTRAINT `opening_periods_businessHoursId_fkey` FOREIGN KEY (`businessHoursId`) REFERENCES `business_hours`(`id`) ON DELETE CASCADE;
