-- AlterTable: how a product is sold (single unit / bulk slabs / enquiry only)
ALTER TABLE `Product` ADD COLUMN `pricingMode` ENUM('SINGLE', 'BULK', 'ENQUIRY') NOT NULL DEFAULT 'BULK';

-- Backfill: products with no price tiers are enquiry-only; products whose
-- only tier starts at 1 piece are single-unit.
UPDATE `Product` p
SET p.`pricingMode` = 'ENQUIRY'
WHERE NOT EXISTS (SELECT 1 FROM `ProductPrice` pp WHERE pp.`productId` = p.`id`);

UPDATE `Product` p
SET p.`pricingMode` = 'SINGLE'
WHERE (SELECT COUNT(*) FROM `ProductPrice` pp WHERE pp.`productId` = p.`id`) = 1
  AND (SELECT MIN(pp.`minQuantity`) FROM `ProductPrice` pp WHERE pp.`productId` = p.`id`) = 1;
