-- AlterTable
ALTER TABLE `users` ADD COLUMN `lastFailedLoginAt` DATETIME(3) NULL,
    ADD COLUMN `lockReason` VARCHAR(255) NULL,
    ADD COLUMN `lockedAt` DATETIME(3) NULL;
