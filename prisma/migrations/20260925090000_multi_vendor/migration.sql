-- Multi-vendor marketplace.
--
--  1. New `Vendor` entity — every product is owned by exactly one vendor and
--     customer orders split into per-vendor sub-orders for fulfilment.
--  2. `User.role` gains VENDOR (a seller login linked to a vendor via
--     `User.vendorId`).
--  3. `Order` gains the split fields: `parentId` (parent → sub-orders),
--     `vendorId` (fulfilling vendor) and `subOrderNumber`.
--  4. Existing catalogue is backfilled to the platform's own default vendor
--     so the storefront keeps working unchanged.

-- ---------------------------------------------------------------------------
-- Vendor
-- ---------------------------------------------------------------------------
CREATE TABLE `Vendor` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `slug` VARCHAR(140) NOT NULL,
    `legalName` VARCHAR(160) NULL,
    `email` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `gstin` VARCHAR(15) NULL,
    `pan` VARCHAR(10) NULL,
    `address` VARCHAR(300) NULL,
    `city` VARCHAR(80) NULL,
    `state` VARCHAR(80) NULL,
    `pincode` VARCHAR(10) NULL,
    `stateCode` VARCHAR(2) NOT NULL DEFAULT '07',
    `logo` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vendor_slug_key`(`slug`),
    UNIQUE INDEX `Vendor_email_key`(`email`),
    INDEX `Vendor_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- The platform's own vendor. All pre-existing products belong to it, so the
-- storefront (single-seller until now) keeps working with zero data fixes.
INSERT INTO `Vendor` (`id`, `name`, `slug`, `legalName`, `email`, `stateCode`, `status`, `isDefault`, `sortOrder`, `updatedAt`)
VALUES ('vnd_kcs_default', 'KCS G-Mart', 'kcs-gmart', 'KCS G-Mart', 'sales@kcsgmart.in', '07', 'ACTIVE', true, 0, NOW(3));

-- ---------------------------------------------------------------------------
-- User — VENDOR role + vendor link
-- ---------------------------------------------------------------------------
ALTER TABLE `User` MODIFY `role` ENUM('CUSTOMER', 'ADMIN', 'VENDOR') NOT NULL DEFAULT 'CUSTOMER';

ALTER TABLE `User` ADD COLUMN `vendorId` VARCHAR(191) NULL;

CREATE INDEX `User_vendorId_idx` ON `User`(`vendorId`);

ALTER TABLE `User` ADD CONSTRAINT `User_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Order — parent / sub-order split
-- ---------------------------------------------------------------------------
ALTER TABLE `Order` ADD COLUMN `parentId` VARCHAR(191) NULL;

ALTER TABLE `Order` ADD COLUMN `vendorId` VARCHAR(191) NULL;

ALTER TABLE `Order` ADD COLUMN `subOrderNumber` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Order_subOrderNumber_key` ON `Order`(`subOrderNumber`);

CREATE INDEX `Order_parentId_idx` ON `Order`(`parentId`);

CREATE INDEX `Order_vendorId_idx` ON `Order`(`vendorId`);

ALTER TABLE `Order` ADD CONSTRAINT `Order_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Order` ADD CONSTRAINT `Order_parentId_fkey`
    FOREIGN KEY (`parentId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Product — vendor ownership (backfilled to the default vendor)
-- ---------------------------------------------------------------------------
ALTER TABLE `Product` ADD COLUMN `vendorId` VARCHAR(191) NULL;

UPDATE `Product` SET `vendorId` = 'vnd_kcs_default';

ALTER TABLE `Product` MODIFY `vendorId` VARCHAR(191) NOT NULL;

CREATE INDEX `Product_vendorId_idx` ON `Product`(`vendorId`);

ALTER TABLE `Product` ADD CONSTRAINT `Product_vendorId_fkey`
    FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
