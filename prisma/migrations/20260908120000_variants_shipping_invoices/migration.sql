-- AlterTable
ALTER TABLE `Order` ADD COLUMN `cgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `chargeableWeight` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `courierName` VARCHAR(80) NULL,
    ADD COLUMN `deliveredAt` DATETIME(3) NULL,
    ADD COLUMN `expectedAt` DATETIME(3) NULL,
    ADD COLUMN `igst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `invoiceNumber` VARCHAR(191) NULL,
    ADD COLUMN `invoicedAt` DATETIME(3) NULL,
    ADD COLUMN `placeOfSupply` VARCHAR(2) NULL,
    ADD COLUMN `sgst` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `shipmentNote` VARCHAR(500) NULL,
    ADD COLUMN `shippedAt` DATETIME(3) NULL,
    ADD COLUMN `shippingMethod` VARCHAR(60) NULL,
    ADD COLUMN `shippingZone` VARCHAR(40) NULL,
    ADD COLUMN `taxableAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `trackingNumber` VARCHAR(80) NULL,
    ADD COLUMN `trackingUrl` VARCHAR(500) NULL;

-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `gstRate` DECIMAL(4, 2) NOT NULL DEFAULT 18,
    ADD COLUMN `hsnCode` VARCHAR(10) NULL,
    ADD COLUMN `sku` VARCHAR(60) NULL,
    ADD COLUMN `taxAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `variantId` VARCHAR(191) NULL,
    ADD COLUMN `variantLabel` VARCHAR(120) NULL,
    ADD COLUMN `weightGrams` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `gstRate` DECIMAL(4, 2) NOT NULL DEFAULT 18,
    ADD COLUMN `hasVariants` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `heightCm` DECIMAL(7, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `hsnCode` VARCHAR(10) NULL,
    ADD COLUMN `lengthCm` DECIMAL(7, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `weightGrams` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `widthCm` DECIMAL(7, 2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `ProductOption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(40) NOT NULL,
    `values` JSON NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProductOption_productId_idx`(`productId`),
    UNIQUE INDEX `ProductOption_productId_name_key`(`productId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `attributes` JSON NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `basePrice` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `baseMrp` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `weightGrams` INTEGER NULL,
    `lengthCm` DECIMAL(7, 2) NULL,
    `widthCm` DECIMAL(7, 2) NULL,
    `heightCm` DECIMAL(7, 2) NULL,

    UNIQUE INDEX `ProductVariant_sku_key`(`sku`),
    INDEX `ProductVariant_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VariantPrice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `variantId` VARCHAR(191) NOT NULL,
    `minQuantity` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `mrp` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `VariantPrice_variantId_minQuantity_key`(`variantId`, `minQuantity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingZone` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `states` JSON NOT NULL,
    `etaDays` VARCHAR(20) NOT NULL DEFAULT '3-5',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `ShippingZone_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShippingRate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `zoneId` INTEGER NOT NULL,
    `uptoGrams` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `ShippingRate_zoneId_uptoGrams_key`(`zoneId`, `uptoGrams`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `freeShippingThreshold` DECIMAL(10, 2) NOT NULL DEFAULT 1000,
    `extraPer500g` JSON NULL,
    `volumetricDivisor` INTEGER NOT NULL DEFAULT 5000,
    `sellerName` VARCHAR(120) NOT NULL DEFAULT 'KCS G-Mart',
    `sellerGstin` VARCHAR(15) NULL,
    `sellerPan` VARCHAR(10) NULL,
    `sellerAddress` VARCHAR(300) NULL,
    `sellerStateCode` VARCHAR(2) NOT NULL DEFAULT '07',
    `sellerEmail` VARCHAR(120) NULL,
    `sellerPhone` VARCHAR(20) NULL,
    `invoicePrefix` VARCHAR(20) NOT NULL DEFAULT 'KCS/INV',
    `invoiceCounter` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Order_invoiceNumber_key` ON `Order`(`invoiceNumber`);

-- CreateIndex
CREATE INDEX `OrderItem_variantId_idx` ON `OrderItem`(`variantId`);

-- AddForeignKey
ALTER TABLE `ProductOption` ADD CONSTRAINT `ProductOption_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VariantPrice` ADD CONSTRAINT `VariantPrice_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ShippingRate` ADD CONSTRAINT `ShippingRate_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `ShippingZone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

