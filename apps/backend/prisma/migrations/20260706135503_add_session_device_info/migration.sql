-- AlterTable
ALTER TABLE `refresh_tokens` ADD COLUMN `ipAddress` VARCHAR(45) NULL,
    ADD COLUMN `userAgent` VARCHAR(500) NULL;
