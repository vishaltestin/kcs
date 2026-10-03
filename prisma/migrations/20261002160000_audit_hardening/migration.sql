-- ---------------------------------------------------------------------------
-- Audit hardening: inventory, idempotency, session revocation, stock tracking,
-- meeting-slot uniqueness.
--
-- Legacy-data conventions applied below (all idempotent):
--   • Product/ProductVariant.trackStock  = (stock > 0)   -- stock 0 used to mean
--     "untracked / made to order"; keeping that meaning explicit.
--   • OrderItem.stockReserved            = 0             -- orders placed before
--     this migration cannot be reconciled against the old unconditional
--     decrement, so nothing is restored for them on cancellation.
--   • MeetingBooking.activeSlot          = NULL for existing rows (historical
--     bookings are grandfathered; new bookings take the unique slot).
-- ---------------------------------------------------------------------------

-- User: session revocation counter -----------------------------------------
ALTER TABLE `User` ADD COLUMN `sessionVersion` INTEGER NOT NULL DEFAULT 0;

-- Order: checkout idempotency key ------------------------------------------
ALTER TABLE `Order` ADD COLUMN `checkoutKey` VARCHAR(64) NULL;
-- MySQL allows many NULLs in a unique index, so guest orders (userId NULL)
-- and pre-existing orders are unaffected.
CREATE UNIQUE INDEX `Order_userId_checkoutKey_key` ON `Order`(`userId`, `checkoutKey`);

-- OrderItem: exactly what was reserved -------------------------------------
ALTER TABLE `OrderItem` ADD COLUMN `stockReserved` INTEGER NOT NULL DEFAULT 0;

-- Product / ProductVariant: explicit stock-tracking flag -------------------
ALTER TABLE `Product` ADD COLUMN `trackStock` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `ProductVariant` ADD COLUMN `trackStock` BOOLEAN NOT NULL DEFAULT true;

UPDATE `Product` SET `trackStock` = (`stock` > 0);
UPDATE `ProductVariant` SET `trackStock` = (`stock` > 0);

-- MeetingBooking: one active booking per slot ------------------------------
ALTER TABLE `MeetingBooking` ADD COLUMN `activeSlot` VARCHAR(60) NULL;
CREATE UNIQUE INDEX `MeetingBooking_activeSlot_key` ON `MeetingBooking`(`activeSlot`);
