-- AlterTable
ALTER TABLE `Product` ADD COLUMN `variantPricing` ENUM('SHARED', 'CUSTOM') NOT NULL DEFAULT 'SHARED';

-- AlterTable
ALTER TABLE `ProductVariant` ADD COLUMN `priceDelta` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Existing variant products already carry their own tier tables: keep them
-- exactly as they are by marking them CUSTOM. New products default to SHARED.
UPDATE `Product` SET `variantPricing` = 'CUSTOM' WHERE `hasVariants` = 1;
