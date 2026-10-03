-- ---------------------------------------------------------------------------
-- Curated home-page category tiles.
--
-- Two storefront sections share one table (distinguished by `section`):
--   • "mosaic"   — the tiles arranged around the banner slider, above New Arrivals
--   • "featured" — the 3-up category cards below the Best Sellers rail
--
-- No data migration: a section with no rows falls back to the tiles that
-- shipped with the design, so an existing storefront renders exactly as before
-- until an admin saves a tile.
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE `HomeTile` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `section` VARCHAR(24) NOT NULL,
    `label` VARCHAR(120) NOT NULL,
    `image` VARCHAR(300) NOT NULL,
    `href` VARCHAR(200) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HomeTile_section_isActive_sortOrder_idx`(`section`, `isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
