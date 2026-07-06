-- Add columns (familyId nullable initially to backfill existing rows)
ALTER TABLE `refresh_tokens` ADD COLUMN `familyId` CHAR(36) NULL,
    ADD COLUMN `parentTokenId` CHAR(36) NULL,
    ADD COLUMN `reuseDetected` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `revokedAt` DATETIME(3) NULL,
    ADD COLUMN `rotatedAt` DATETIME(3) NULL;

-- Backfill existing rows with a unique UUID per token (each existing token becomes its own family root)
UPDATE `refresh_tokens` SET `familyId` = (SELECT LOWER(CONCAT(
    HEX(RANDOM_BYTES(4)), '-',
    HEX(RANDOM_BYTES(2)), '-',
    HEX(RANDOM_BYTES(2)), '-',
    HEX(RANDOM_BYTES(2)), '-',
    HEX(RANDOM_BYTES(6))
))) WHERE `familyId` IS NULL;

-- Make familyId NOT NULL after backfill
ALTER TABLE `refresh_tokens` MODIFY COLUMN `familyId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE INDEX `refresh_tokens_familyId_idx` ON `refresh_tokens`(`familyId`);

-- CreateIndex
CREATE INDEX `refresh_tokens_parentTokenId_idx` ON `refresh_tokens`(`parentTokenId`);
