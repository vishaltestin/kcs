-- AlterTable
ALTER TABLE `BlogPost` ADD COLUMN `metaDescription` VARCHAR(165) NULL,
    ADD COLUMN `metaKeywords` VARCHAR(255) NULL,
    ADD COLUMN `metaTitle` VARCHAR(70) NULL,
    ADD COLUMN `ogImage` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Category` ADD COLUMN `metaDescription` VARCHAR(165) NULL,
    ADD COLUMN `metaKeywords` VARCHAR(255) NULL,
    ADD COLUMN `metaTitle` VARCHAR(70) NULL,
    ADD COLUMN `ogImage` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `metaDescription` VARCHAR(165) NULL,
    ADD COLUMN `metaKeywords` VARCHAR(255) NULL,
    ADD COLUMN `metaTitle` VARCHAR(70) NULL,
    ADD COLUMN `ogImage` VARCHAR(191) NULL;
