-- Migration: Add ReservationPolicy model
-- Description: Creates the reservation_policies table for managing reservation business rules per restaurant.

-- Create reservation_policies table
CREATE TABLE `reservation_policies` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `restaurantId` CHAR(36) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `minPartySize` INT NOT NULL DEFAULT 1,
    `maxPartySize` INT NOT NULL DEFAULT 20,
    `defaultReservationDuration` INT NOT NULL DEFAULT 60,
    `minAdvanceBookingMinutes` INT NOT NULL DEFAULT 60,
    `maxAdvanceBookingDays` INT NOT NULL DEFAULT 30,
    `cancellationDeadlineMinutes` INT NOT NULL DEFAULT 1440,
    `modificationDeadlineMinutes` INT NOT NULL DEFAULT 1440,
    `allowWalkIns` BOOLEAN NOT NULL DEFAULT true,
    `autoConfirmReservations` BOOLEAN NOT NULL DEFAULT false,
    `requireCustomerPhone` BOOLEAN NOT NULL DEFAULT false,
    `requireCustomerEmail` BOOLEAN NOT NULL DEFAULT true,
    `maxActiveReservationsPerCustomer` INT NOT NULL DEFAULT 10,
    `gracePeriodMinutes` INT NOT NULL DEFAULT 15,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `reservation_policies_restaurantId_key` (`restaurantId`),
    INDEX `reservation_policies_restaurantId_idx` (`restaurantId`),
    CONSTRAINT `reservation_policies_restaurantId_fkey` FOREIGN KEY (`restaurantId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
