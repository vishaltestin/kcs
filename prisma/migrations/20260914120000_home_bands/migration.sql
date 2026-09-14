-- Home page promo bands: the drinkware and showreel blocks become editable
-- content instead of markup, so a seasonal swap needs no deploy.
CREATE TABLE `HomeBanner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slot` VARCHAR(32) NOT NULL,
    `eyebrow` VARCHAR(120) NULL,
    `title` VARCHAR(200) NOT NULL,
    `subtitle` VARCHAR(400) NULL,
    `ctaLabel` VARCHAR(40) NULL,
    `ctaHref` VARCHAR(200) NULL,
    `image` VARCHAR(300) NULL,
    `videoUrl` VARCHAR(300) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HomeBanner_slot_key`(`slot`),
    INDEX `HomeBanner_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed both bands with the copy the design shipped with, so the fields are
-- already filled in the admin the moment this migration runs.
INSERT INTO `HomeBanner` (`slot`, `eyebrow`, `title`, `subtitle`, `ctaLabel`, `ctaHref`, `image`, `isActive`, `updatedAt`)
VALUES
  ('drinkware', 'Best Price & High Quality', 'Drinkwares for Corporate Gifts',
   'Insulated bottles, tumblers and mugs — laser-engraved with your logo, packed for desks across India.',
   'Shop Now', '/category/drinkwares', '/images/apprals.jpeg', true, NOW(3)),
  ('video', 'Watch the film', 'Perfect Corporate Gifting Solutions for your Company',
   'A one-minute look at how a brief becomes branded boxes on desks across India.',
   'Browse the catalogue', '/product', '/images/video-poster.jpg', true, NOW(3));
