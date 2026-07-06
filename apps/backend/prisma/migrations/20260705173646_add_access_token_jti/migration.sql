-- AlterTable
ALTER TABLE `refresh_tokens` ADD COLUMN `accessTokenJti` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `refresh_tokens_accessTokenJti_idx` ON `refresh_tokens`(`accessTokenJti`);
