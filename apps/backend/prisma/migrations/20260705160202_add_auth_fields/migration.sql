-- AlterTable
ALTER TABLE `users` ADD COLUMN `resetToken` VARCHAR(128) NULL,
    ADD COLUMN `resetTokenExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `verificationToken` VARCHAR(128) NULL,
    ADD COLUMN `verificationTokenExpiresAt` DATETIME(3) NULL;
