-- Create CalendarException table
-- Overrides business hours for specific dates (holidays, closures, events).
-- Multiple exceptions per restaurant; resolved by priority + date/type uniqueness.
-- Types: holiday, special_opening, temporary_closure, maintenance, private_event, seasonal_hours, emergency_closure

CREATE TABLE `calendar_exceptions` (
    `id` CHAR(36) NOT NULL,
    `restaurantId` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(30) NOT NULL,
    `date` DATE NOT NULL,
    `isClosed` BOOLEAN NOT NULL DEFAULT false,
    `openTime` VARCHAR(5) NULL,
    `closeTime` VARCHAR(5) NULL,
    `allDay` BOOLEAN NOT NULL DEFAULT false,
    `priority` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL,

    UNIQUE INDEX `calendar_exceptions_restaurantId_date_type_key` (`restaurantId`, `date`, `type`),
    INDEX `calendar_exceptions_restaurantId_date_idx` (`restaurantId`, `date`),
    INDEX `calendar_exceptions_date_idx` (`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `calendar_exceptions` ADD CONSTRAINT `calendar_exceptions_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE;
